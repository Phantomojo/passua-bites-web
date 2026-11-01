import { createHmac, timingSafeEqual } from "node:crypto";
export type WhatsAppSendResult =
  | { status: "sent"; messageId: string | null }
  | { status: "not_configured"; reason: string }
  | { status: "failed"; reason: string };
export function normalizeKenyanWhatsAppPhone(phone: string): string {
  const digits=phone.replace(/\D/g,"");
  const normalized=digits.startsWith("0")?`254${digits.slice(1)}`:digits;
  if(!/^254[17]\d{8}$/.test(normalized)) throw new Error("Invalid Kenyan WhatsApp phone number");
  return normalized;
}
export function getKenyanWhatsAppPhoneVariants(phone:string):string[]{
  const n=normalizeKenyanWhatsAppPhone(phone); return [n,`+${n}`,`0${n.slice(3)}`];
}
export async function sendWhatsAppTemplateMessage(args:{to:string;templateName:string|undefined;parameters:string[];language?:string}):Promise<WhatsAppSendResult>{
  const token=process.env.WHATSAPP_ACCESS_TOKEN, id=process.env.WHATSAPP_PHONE_NUMBER_ID, version=process.env.WHATSAPP_GRAPH_API_VERSION;
  if(!token||!id||!version||!args.templateName) return {status:"not_configured",reason:"WhatsApp credentials or approved template are missing"};
  if(!/^v\d+\.\d+$/.test(version)) return {status:"failed",reason:"Invalid Graph API version"};
  let to:string; try{to=normalizeKenyanWhatsAppPhone(args.to)}catch{return {status:"failed",reason:"Invalid recipient phone number"}}
  try{
    const r=await fetch(`https://graph.facebook.com/${version}/${id}/messages`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",recipient_type:"individual",to,type:"template",template:{name:args.templateName,language:{code:args.language||process.env.WHATSAPP_TEMPLATE_LANGUAGE||"en"},components:[{type:"body",parameters:args.parameters.map(text=>({type:"text",text:String(text)}))}]}})});
    if(!r.ok)return {status:"failed",reason:`WhatsApp Cloud API returned HTTP ${r.status}`};
    const data=await r.json() as {messages?:Array<{id?:string}>}; return {status:"sent",messageId:data.messages?.[0]?.id??null};
  }catch{return {status:"failed",reason:"WhatsApp Cloud API request failed"}}
}
export function verifyWhatsAppWebhookToken(candidate:string|undefined,configured:string|undefined):boolean{
 if(!candidate||!configured)return false;const a=Buffer.from(candidate),b=Buffer.from(configured);return a.length===b.length&&timingSafeEqual(a,b);
}
export function verifyWhatsAppWebhookSignature(body:Buffer|undefined,signature:string|undefined,secret:string|undefined):boolean{
 if(!body||!signature||!secret||!signature.startsWith("sha256="))return false;
 const expected=Buffer.from(`sha256=${createHmac("sha256",secret).update(body).digest("hex")}`),received=Buffer.from(signature);
 return expected.length===received.length&&timingSafeEqual(expected,received);
}
export function extractWhatsAppMarketingOptOutSenders(payload:unknown):string[]{
 if(!payload||typeof payload!=="object")return [];
 const root=payload as {entry?:Array<{changes?:Array<{value?:{messages?:Array<{from?:string;type?:string;text?:{body?:string}}>} }>} >};
 const senders=new Set<string>();
 for(const e of root.entry??[])for(const c of e.changes??[])for(const m of c.value?.messages??[]){
  if(m.type!=="text"||!/^(STOP|STOPALL|UNSUBSCRIBE|CANCEL|END|QUIT)$/i.test((m.text?.body||"").trim()))continue;
  try{senders.add(normalizeKenyanWhatsAppPhone(m.from||""))}catch{/* ignore malformed sender */}
 }
return Array.from(senders);
}
