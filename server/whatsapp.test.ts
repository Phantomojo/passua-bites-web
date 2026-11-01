import { createHmac } from "node:crypto";
import { describe,expect,it } from "vitest";
import {extractWhatsAppMarketingOptOutSenders,getKenyanWhatsAppPhoneVariants,normalizeKenyanWhatsAppPhone,verifyWhatsAppWebhookSignature,verifyWhatsAppWebhookToken} from "./_core/whatsapp";
describe("WhatsApp helpers",()=>{
 it("normalizes Kenyan phone numbers",()=>{expect(normalizeKenyanWhatsAppPhone("0712345678")).toBe("254712345678");expect(normalizeKenyanWhatsAppPhone("+254712345678")).toBe("254712345678");expect(getKenyanWhatsAppPhoneVariants("254712345678")).toEqual(["254712345678","+254712345678","0712345678"]);});
 it("rejects invalid phone numbers",()=>expect(()=>normalizeKenyanWhatsAppPhone("12345")).toThrow());
 it("checks verification tokens",()=>{expect(verifyWhatsAppWebhookToken("x","x")).toBe(true);expect(verifyWhatsAppWebhookToken("y","x")).toBe(false);});
 it("verifies Meta raw-body signatures",()=>{const body=Buffer.from("{}"),secret="secret",sig=`sha256=${createHmac("sha256",secret).update(body).digest("hex")}`;expect(verifyWhatsAppWebhookSignature(body,sig,secret)).toBe(true);expect(verifyWhatsAppWebhookSignature(body,sig,"wrong")).toBe(false);});
 it("extracts only STOP-style text messages",()=>{const p={entry:[{changes:[{value:{messages:[{from:"254712345678",type:"text",text:{body:"STOP"}},{from:"254722222222",type:"text",text:{body:"Hi"}},{from:"invalid",type:"text",text:{body:"UNSUBSCRIBE"}}]}}]}]};expect(extractWhatsAppMarketingOptOutSenders(p)).toEqual(["254712345678"]);});
});
