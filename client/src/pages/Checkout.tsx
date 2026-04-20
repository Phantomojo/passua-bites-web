import { useState, useEffect } from "react";
import { Link } from "wouter";
import { PBNav, PBFooter } from "./Home";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash">("mpesa");
  const [mpesaCode, setMpesaCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [stkSent, setStkSent] = useState(false);
  const [stkChecking, setStkChecking] = useState(false);

  const createOrder = trpc.orders.create.useMutation();
  const initiateStk = trpc.payments.initiateStkPush.useMutation();
  const [pollingId, setPollingId] = useState<string>("");

  const queryPayment = trpc.payments.queryStatus.useQuery(
    { checkoutRequestID: pollingId },
    {
      enabled: !!pollingId,
      retry: false,
      refetchInterval: 5000,
      throwOnError: false,
    }
  );

  // Watch for payment completion
  useEffect(() => {
    if (queryPayment.error) {
      setStkChecking(false);
      setPollingId("");
      return;
    }
    if (!queryPayment.data) return;
    if (queryPayment.data.status === "completed") {
      setStkChecking(false);
      setPollingId("");
      toast.success("Payment confirmed! Your order is being prepared.");
    } else if (
      queryPayment.data.status === "failed" ||
      queryPayment.data.status === "cancelled"
    ) {
      setStkChecking(false);
      setPollingId("");
      toast.error(
        "Payment was not completed. You can retry or pay cash on delivery."
      );
    }
  }, [queryPayment.data]);

  const startPaymentPolling = (checkoutRequestID: string) => {
    setPollingId(checkoutRequestID);
    setStkChecking(true);
  };

  useEffect(() => {
    const stored = localStorage.getItem("passua_cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = total >= 300 ? 0 : 50;
  const grandTotal = total + deliveryFee;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.customerName ||
      !formData.customerPhone ||
      !formData.deliveryAddress
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Phone validation
    const phoneRegex = /^(?:\+254|0)[7][0-9]{8}$/;
    if (!phoneRegex.test(formData.customerPhone)) {
      toast.error("Enter a valid Kenyan phone number (e.g. 0712345678)");
      return;
    }

    setIsProcessing(true);
    try {
      // Create order
      const orderResult = await createOrder.mutateAsync({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        deliveryAddress: formData.deliveryAddress,
        items: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        notes: mpesaCode ? `M-Pesa Code: ${mpesaCode}` : undefined,
      });

      const newOrderId = orderResult.orderId;
      setOrderId(newOrderId);

      if (paymentMethod === "mpesa") {
        // Trigger M-Pesa STK Push
        try {
          const stkResult = await initiateStk.mutateAsync({
            orderId: newOrderId,
            phoneNumber: formData.customerPhone,
          });
          setStkSent(true);
          toast.success(stkResult.message);

          // Start polling for payment status
          startPaymentPolling(stkResult.checkoutRequestID);
        } catch (stkError: any) {
          // STK Push failed but order was created
          toast.warning(
            `Order created but M-Pesa prompt failed: ${stkError.message}. You can pay cash on delivery.`
          );
        }
      } else {
        // Cash payment - order confirmed
        toast.success("Order placed! Pay cash on delivery.");
      }

      // Clear cart
      localStorage.removeItem("passua_cart");
      setCart([]);
      setOrderPlaced(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  const labelStyle = {
    fontFamily: "'DM Mono',monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "var(--pb-ember)",
    textTransform: "uppercase" as const,
    marginBottom: "0.4rem",
    display: "block",
  };
  const inputStyle = {
    width: "100%",
    padding: "0.65rem 0.8rem",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: "0.85rem",
  };

  // Order confirmation screen
  if (orderPlaced && orderId) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
        <PBNav />
        <div
          style={{
            padding: "4rem 2.5rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              background: "var(--pb-bg2)",
              border: "1px solid var(--pb-rule)",
              borderLeft: "3px solid #4ade80",
              padding: "2.5rem",
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.18em",
                color: "#4ade80",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Order confirmed
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "2rem",
                fontWeight: 900,
                marginBottom: "1.5rem",
              }}
            >
              You're in queue.
            </h1>

            <div
              style={{
                background: "rgba(74,222,128,0.05)",
                border: "1px solid rgba(74,222,128,0.2)",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.6rem",
                  color: "#4ade80",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "0.3rem",
                }}
              >
                Order ID
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                }}
              >
                PB-{orderId}
              </div>
            </div>

            {[
              ["Name", formData.customerName],
              ["Phone", formData.customerPhone],
              ["Delivery address", formData.deliveryAddress],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  paddingBottom: "0.75rem",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid var(--pb-rule2)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.58rem",
                    color: "var(--pb-ivory3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.2rem",
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--pb-ivory)",
                    fontWeight: 300,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 0",
                borderTop: "1px solid var(--pb-rule)",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--pb-ivory3)",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--pb-ember)",
                }}
              >
                Ksh {grandTotal}
              </span>
            </div>

            {paymentMethod === "mpesa" ? (
              <div
                style={{
                  background: "rgba(196,92,40,0.05)",
                  border: "1px solid var(--pb-rule2)",
                  borderLeft: "3px solid var(--pb-ember)",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.6rem",
                    color: "var(--pb-ember)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Payment Instructions
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--pb-ivory2)",
                    fontWeight: 300,
                    lineHeight: 1.7,
                    marginBottom: "0.75rem",
                  }}
                >
                  Pay{" "}
                  <strong style={{ color: "var(--pb-ember)" }}>
                    Ksh {grandTotal}
                  </strong>{" "}
                  to:
                  <br />
                  <strong>Paybill:</strong>{" "}
                  <span
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "1rem",
                      color: "var(--pb-ivory)",
                    }}
                  >
                    400200
                  </span>
                  <br />
                  <strong>Account:</strong>{" "}
                  <span
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "1rem",
                      color: "var(--pb-ivory)",
                    }}
                  >
                    1053125
                  </span>
                </div>
                {mpesaCode && (
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--pb-ivory3)",
                      marginTop: "0.5rem",
                    }}
                  >
                    Your code:{" "}
                    <strong
                      style={{
                        color: "var(--pb-ivory)",
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {mpesaCode}
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(196,92,40,0.05)",
                  border: "1px solid var(--pb-rule2)",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.6rem",
                    color: "var(--pb-ember)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Payment method
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--pb-ivory3)",
                    fontWeight: 300,
                  }}
                >
                  Cash on delivery. Have exact change ready.
                </div>
              </div>
            )}

            <div
              style={{
                background: "rgba(37,211,102,0.05)",
                border: "1px solid rgba(37,211,102,0.2)",
                padding: "1rem",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--pb-ivory2)",
                  fontWeight: 300,
                  marginBottom: "0.75rem",
                }}
              >
                <strong style={{ color: "var(--pb-ivory)" }}>Next step:</strong>
                <br />
                Notify us on WhatsApp so we can confirm your order
              </div>
              <a
                href={`https://wa.me/254722473873?text=${encodeURIComponent(`Hi! I just placed order PB-${orderId} on your website.\n\nName: ${formData.customerName}\nPhone: ${formData.customerPhone}\nTotal: Ksh ${grandTotal}\nPayment: ${paymentMethod === "mpesa" ? (mpesaCode ? `M-Pesa (${mpesaCode})` : "M-Pesa (paying now)") : "Cash on delivery"}\nAddress: ${formData.deliveryAddress}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pb-btn-primary"
                style={{
                  display: "inline-block",
                  padding: "0.75rem 1.5rem",
                  textDecoration: "none",
                }}
              >
                📱 Notify on WhatsApp
              </a>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <Link
                href="/orders"
                className="pb-btn-primary"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "0.75rem",
                }}
              >
                Track Your Order
              </Link>
              <Link
                href="/reviews"
                className="pb-btn-ghost"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "0.75rem",
                }}
              >
                ⭐ Leave a Review
              </Link>
              <Link
                href="/"
                className="pb-btn-ghost"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "0.75rem",
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
        <PBNav />
        <div style={{ padding: "6rem 2.5rem", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "2rem",
              marginBottom: "1rem",
            }}
          >
            Your cart is empty
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--pb-ivory3)",
              fontWeight: 300,
              marginBottom: "2rem",
            }}
          >
            Add something delicious to get started.
          </p>
          <Link href="/menu" className="pb-btn-primary">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  // Checkout form
  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />

      <div className="pb-section-mobile" style={{ padding: "3rem 2.5rem" }}>
        <div className="pb-eyebrow">Complete your order</div>
        <h1
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "2.2rem",
            fontWeight: 900,
            marginBottom: "2.5rem",
          }}
        >
          Checkout
        </h1>

        <div
          className="pb-grid-mobile"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "2rem",
            alignItems: "flex-start",
          }}
        >
          {/* Form */}
          <div
            style={{
              background: "var(--pb-bg2)",
              border: "1px solid var(--pb-rule)",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              Delivery Details
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
              }}
            >
              {[
                {
                  name: "customerName",
                  label: "Full name",
                  type: "text",
                  placeholder: "Enter your full name",
                  required: true,
                },
                {
                  name: "customerPhone",
                  label: "Phone number (M-Pesa)",
                  type: "tel",
                  placeholder: "0712 345 678",
                  required: true,
                },
                {
                  name: "customerEmail",
                  label: "Email address",
                  type: "email",
                  placeholder: "your@email.com (optional)",
                  required: false,
                },
              ].map(f => (
                <div key={f.name}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={(formData as any)[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required={f.required}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Delivery address *</label>
                <textarea
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  placeholder="Enter your delivery address in Ruiru area"
                  required
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Payment method */}
              <div>
                <label style={labelStyle}>Payment method</label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mpesa")}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      border: `1px solid ${paymentMethod === "mpesa" ? "var(--pb-ember)" : "var(--pb-rule)"}`,
                      background:
                        paymentMethod === "mpesa"
                          ? "rgba(196,92,40,0.1)"
                          : "transparent",
                      color:
                        paymentMethod === "mpesa"
                          ? "var(--pb-ember)"
                          : "var(--pb-ivory3)",
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      border: `1px solid ${paymentMethod === "cash" ? "var(--pb-ember)" : "var(--pb-rule)"}`,
                      background:
                        paymentMethod === "cash"
                          ? "rgba(196,92,40,0.1)"
                          : "transparent",
                      color:
                        paymentMethod === "cash"
                          ? "var(--pb-ember)"
                          : "var(--pb-ivory3)",
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    Cash
                  </button>
                </div>
              </div>

              {paymentMethod === "mpesa" && (
                <div
                  style={{
                    background: "rgba(196,92,40,0.05)",
                    border: "1px solid var(--pb-rule2)",
                    borderLeft: "3px solid var(--pb-ember)",
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.6rem",
                      color: "var(--pb-ember)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Pay via M-Pesa
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--pb-ivory2)",
                      fontWeight: 300,
                      lineHeight: 1.7,
                      marginBottom: "0.75rem",
                    }}
                  >
                    <strong style={{ color: "var(--pb-ivory)" }}>Steps:</strong>
                    <br />
                    1. Go to M-Pesa on your phone
                    <br />
                    2. Select <strong>Lipa Na M-Pesa</strong>
                    <br />
                    3. Select <strong>Paybill</strong>
                    <br />
                    4. Business No:{" "}
                    <strong
                      style={{ color: "var(--pb-ember)", fontSize: "1rem" }}
                    >
                      400200
                    </strong>
                    <br />
                    5. Account No:{" "}
                    <strong
                      style={{ color: "var(--pb-ember)", fontSize: "1rem" }}
                    >
                      1053125
                    </strong>
                    <br />
                    6. Amount:{" "}
                    <strong style={{ color: "var(--pb-ember)" }}>
                      Ksh {grandTotal}
                    </strong>
                    <br />
                    7. Enter PIN and confirm
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid var(--pb-rule2)",
                      paddingTop: "0.75rem",
                    }}
                  >
                    <label style={{ ...labelStyle, marginBottom: "0.3rem" }}>
                      M-Pesa Confirmation Code (optional)
                    </label>
                    <input
                      type="text"
                      value={mpesaCode}
                      onChange={e => setMpesaCode(e.target.value)}
                      placeholder="e.g. QJK7XXXXXXXX"
                      style={{
                        ...inputStyle,
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--pb-ivory3)",
                        marginTop: "0.3rem",
                      }}
                    >
                      Enter the code from your M-Pesa SMS confirmation
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div
                  style={{
                    background: "rgba(196,92,40,0.05)",
                    border: "1px solid var(--pb-rule2)",
                    padding: "0.85rem",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.6rem",
                      color: "var(--pb-ember)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Cash on Delivery
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--pb-ivory3)",
                      fontWeight: 300,
                    }}
                  >
                    Pay when your order is delivered. Have exact change ready.
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="pb-btn-primary"
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                {isProcessing
                  ? "Processing..."
                  : `Place Order — Ksh ${grandTotal}`}
              </button>

              <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                <span
                  style={{ fontSize: "0.72rem", color: "var(--pb-ivory3)" }}
                >
                  or
                </span>
                <br />
                <a
                  href={`https://wa.me/254722473873?text=${encodeURIComponent(`Hi Passua Bites! I'd like to order:\n${cart.map(i => `${i.name} x${i.quantity}`).join("\n")}\nTotal: Ksh ${grandTotal}\nDelivery: ${formData.deliveryAddress || "TBD"}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.78rem",
                    color: "#25D366",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  📱 Order via WhatsApp instead
                </a>
              </div>
            </form>
          </div>

          {/* Order summary */}
          <div
            style={{
              background: "var(--pb-bg2)",
              border: "1px solid var(--pb-rule)",
              padding: "1.5rem",
              position: "sticky",
              top: "5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "1.2rem",
              }}
            >
              Order Summary
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.85rem 0",
                    borderBottom: "1px solid var(--pb-rule2)",
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: "0.88rem", color: "var(--pb-ivory)" }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        color: "var(--pb-ivory3)",
                      }}
                    >
                      x{item.quantity}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--pb-ember)",
                    }}
                  >
                    Ksh {item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: "1rem", marginTop: "0.25rem" }}>
              {[
                ["Subtotal", `Ksh ${total}`],
                ["Delivery", deliveryFee === 0 ? "Free" : `Ksh ${deliveryFee}`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.82rem",
                    color: "var(--pb-ivory3)",
                    marginBottom: "0.4rem",
                  }}
                >
                  <span>{k}</span>
                  <span style={{ color: "var(--pb-ivory2)" }}>{v}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--pb-rule)",
                  paddingTop: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--pb-ivory3)",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--pb-ember)",
                  }}
                >
                  Ksh {grandTotal}
                </span>
              </div>
              {deliveryFee === 0 && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    background: "rgba(74,222,128,0.05)",
                    border: "1px solid rgba(74,222,128,0.2)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "#4ade80",
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    ✓ Free delivery on orders over Ksh 300
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order on WhatsApp"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(37,211,102,0.4)",
          zIndex: 999,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <PBFooter />
    </div>
  );
}
