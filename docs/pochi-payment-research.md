# Pochi la Biashara and automated payment research

Research date: 15 August 2026.

## Official source 1: Safaricom M-PESA API

URL: https://www.safaricom.co.ke/main-mpesa/m-pesa-services/do-more-with-m-pesa/m-pesa-api

Safaricom describes the M-PESA API as open web-service interfaces for applications to connect to the M-PESA core. The page explicitly discusses **Automated Payment Receipt Processing** and says newer payment notifications can include an optional validation step for **Paybill** recipients. The same page also describes automated disbursements and reversals. It directs API onboarding or feedback requests to M-PESABusiness@safaricom.co.ke.

Important limitation: this official page does not establish that an ordinary Pochi la Biashara phone account can be used directly as a Daraja callback target. Its automated validation description is specifically framed around Paybill, so Pochi eligibility must be confirmed with Safaricom Business before implementing a Pochi-specific automated flow.

## Official source 2: Safaricom Pochi la Biashara FAQ

URL: https://www.safaricom.co.ke/media-center-landing/frequently-asked-questions/pochi-la-biashara

The official FAQ describes Pochi as a merchant service and lists customer payment channels, business-owner access channels, merchant withdrawals, transfers, and Lipa na Pochi usage. The page’s visible FAQ topics do not document a public Pochi webhook, callback URL, STK Push initiation flow, or direct API credential model. This is evidence against assuming that simply changing the displayed payment number to 0725619991 will produce automatic web confirmation.

## Current engineering implication

The existing website’s STK Push implementation is built around Daraja credentials, a shortcode, passkey, callback URL, and a transaction query. Pochi la Biashara 0725619991 should therefore be treated as a **manual or separately onboarded merchant payment channel** until Safaricom confirms an API product and provisions the required credentials. The website can safely display the Pochi number and request a customer-entered confirmation code, but it must not mark an order paid solely because the user typed a number or clicked “I have paid.”

## Official source 3: Daraja Getting Started

URL: https://developer.safaricom.co.ke/apis/GettingStarted

Safaricom’s developer portal documents REST APIs including B2C, C2B, and B2B. It defines a short code as a unique number for receiving customer payments, including PayBill, Buy Goods, or Till. For going live, it says a business needs an M-PESA account such as a PayBill, Till Number, or B2C account and access to the M-PESA Portal with an Admin or Business Manager.

The page states that M-PESA APIs are asynchronous and send responses to callback or result URLs. It also says that the server should expose POST listeners and that production callbacks require the documented Safaricom API Gateway IPs to be whitelisted. This supports a callback-based automated flow for a supported Daraja merchant account, but it still does not establish that a Pochi phone number alone is an eligible short code.

URL: https://developer.safaricom.co.ke/apis/PullTransaction

## Official source 4: Daraja Pull Transactions

Safaricom documents Pull Transactions as a reconciliation tool for **C2B transactions under a PayBill or Till number within the last 48 hours**. The merchant registers the short code once, then can query a time range to recover successful or missed callback notifications. The registration request includes a short code, nominated number, and callback URL; the documentation says the short code must belong to a live production user.

This is a credible fallback for a supported PayBill/Till account, but it is not evidence that Pochi la Biashara 0725619991 can be queried through Pull Transactions. The Pochi number should not be inserted into the Pull API until Safaricom confirms that it is provisioned as an eligible C2B short code.

## Updated conclusion

The safest automated architecture is:

| Payment channel | Website automation status | Required confirmation |
| --- | --- | --- |
| Existing Daraja STK Push | Technically suitable when the business has valid Daraja credentials, shortcode, passkey, and HTTPS callback | Safaricom credentials and production callback onboarding |
| Pochi la Biashara 0725619991 | Can safely be displayed for customer payment instructions; automatic confirmation is not established by the public Pochi material | Safaricom Business must confirm Pochi API/short-code eligibility or provide a supported integration |
| Daraja C2B callback/Pull | Suitable for supported PayBill/Till accounts; callback plus reconciliation gives reliable order confirmation | Live C2B onboarding, registered short code, callback URL, IP allowlist, and idempotent reconciliation |
| Manual confirmation | Available immediately and safest for Pochi until onboarding is confirmed | Admin enters/verifies the M-Pesa receipt code; order remains pending until approved |
