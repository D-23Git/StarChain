import { readFileSync, writeFileSync } from 'fs';
import * as sdk from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const PASS    = 'Test SDF Network ; September 2015';
const WASM_PATH = 'contract/target/wasm32-unknown-unknown/release/starchain_reviews.wasm';

async function deploy() {
  const server = new (sdk.SorobanRpc || sdk.rpc).Server(RPC_URL);
  const kp = sdk.Keypair.fromSecret('SC6RGT36U2XMTXJRP7MBXHL7EAZV4MIV64N3V6YDY7L2B657Y5Z5H6S6');
  
  const wasm = readFileSync(WASM_PATH);
  console.log('🚀 Final Force Deployment... (WASM size:', wasm.length, ')');
  
  const op = sdk.Operation.uploadWasm({ wasm });
  const acc = await server.getAccount(kp.publicKey());
  const tx = new sdk.TransactionBuilder(acc, { fee: '20000', networkPassphrase: PASS })
    .addOperation(op).setTimeout(60).build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(kp);
  const resp = await server.sendTransaction(prepared);
  
  let r = await server.getTransaction(resp.hash);
  while (r.status === 'NOT_FOUND') {
    await new Promise(res => setTimeout(res, 2000));
    r = await server.getTransaction(resp.hash);
  }
  
  const meta = typeof r.resultMetaXdr === 'string' ? sdk.xdr.TransactionMeta.fromXDR(r.resultMetaXdr, 'base64') : (r.meta || r.result_meta_xdr);
  const getVal = (m) => {
    let v;
    try { v = m.v3(); } catch(_) { try { v = m.v2(); } catch(_) { try { v = m.v1(); } catch(_) { v = m.v0(); } } }
    return v.sorobanMeta?.()?.returnValue?.() || v.returnValue?.() || v;
  };
  
  const wasmId = getVal(meta).bytes().toString('hex');
  console.log('✅ WASM_ID:', wasmId);

  const acc2 = await server.getAccount(kp.publicKey());
  const op2 = sdk.Operation.createContract({ wasmId, address: kp.publicKey() });
  const tx2 = new sdk.TransactionBuilder(acc2, { fee: '20000', networkPassphrase: PASS })
    .addOperation(op2).setTimeout(60).build();
    
  const prepared2 = await server.prepareTransaction(tx2);
  prepared2.sign(kp);
  const resp2 = await server.sendTransaction(prepared2);
  
  let r2 = await server.getTransaction(resp2.hash);
  while (r2.status === 'NOT_FOUND') {
    await new Promise(res => setTimeout(res, 2000));
    r2 = await server.getTransaction(resp2.hash);
  }
  
  const meta2 = typeof r2.resultMetaXdr === 'string' ? sdk.xdr.TransactionMeta.fromXDR(r2.resultMetaXdr, 'base64') : (r2.meta || r2.result_meta_xdr);
  const contractId = sdk.Address.fromScVal(getVal(meta2)).toString();
  console.log('✅ FINAL_CONTRACT_ID:', contractId);
}
deploy().catch(e => {
  console.error('❌ FAIL:', e);
  process.exit(1);
});
