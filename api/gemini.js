export default async function handler(req,res){
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'只支援 POST'});
  }
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)return res.status(500).json({error:'伺服器未設定 GEMINI_API_KEY 環境變數'});
  const {prompt,model='gemini-2.5-flash'}=req.body||{};
  if(!prompt||typeof prompt!=='string')return res.status(400).json({error:'缺少 prompt'});
  if(!/^[a-zA-Z0-9._-]+$/.test(model))return res.status(400).json({error:'模型名稱格式不正確'});
  try{
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt.slice(0,30000)}]}],generationConfig:{temperature:.2,maxOutputTokens:2048}})});
    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({error:data.error?.message||'Gemini API 呼叫失敗'});
    const text=data.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('\n')||'';
    return res.status(200).json({text,model});
  }catch(error){return res.status(502).json({error:error?.message||'無法連線至 Gemini'});}
}
