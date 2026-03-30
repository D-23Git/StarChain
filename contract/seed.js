import * as sdkNamespace from '@stellar/stellar-sdk';
const sdk = sdkNamespace.default || sdkNamespace;
const { TransactionBuilder, Networks, Keypair, Contract, Address, nativeToScVal } = sdk;
const SorobanRpc = sdk.SorobanRpc || sdk.rpc || sdk.default?.SorobanRpc;
import { readFileSync, writeFileSync } from 'fs';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const server = new SorobanRpc.Server(RPC_URL);

async function run() {
  console.log('🚀 SEEDING BLOCKCHAIN (V9 ULTIMATE)...');
  const kp = Keypair.random();
  console.log('🔑 Deployer:', kp.publicKey());
  
  await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
  console.log('💰 Funded');

  const wasm = readFileSync('./contract/target/wasm32-unknown-unknown/release/starchain_reviews.wasm');
  
  // 1. Upload WASM
  const tx = new TransactionBuilder(await server.getAccount(kp.publicKey()), { fee: '20000', networkPassphrase: Networks.TESTNET })
    .addOperation(sdk.Operation.uploadWasm({ wasm }))
    .setTimeout(60).build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(kp);
  const resp = await server.sendTransaction(prepared);
  let r = await server.getTransaction(resp.hash);
  while (r.status === 'NOT_FOUND') { await new Promise(z => setTimeout(z, 2000)); r = await server.getTransaction(resp.hash); }
  
  const meta = typeof r.resultMetaXdr === 'string' ? sdk.xdr.TransactionMeta.fromXDR(r.resultMetaXdr, 'base64') : (r.meta || r.result_meta_xdr);
  const getVal = (m) => {
    let v;
    try { v = m.v3(); } catch(_) { try { v = m.v2(); } catch(_) { try { v = m.v1(); } catch(_) { v = m.v0(); } } }
    return v.sorobanMeta?.()?.returnValue?.() || v.returnValue?.() || v;
  };
  const wasmId = getVal(meta).bytes().toString('hex');
  console.log('✅ WASM ID:', wasmId);

  // 2. Create Contract
  const tx2 = new TransactionBuilder(await server.getAccount(kp.publicKey()), { fee: '20000', networkPassphrase: Networks.TESTNET })
    .addOperation(sdk.Operation.createContract({ wasmId, address: kp.publicKey() }))
    .setTimeout(60).build();
  const prepared2 = await server.prepareTransaction(tx2);
  prepared2.sign(kp);
  const resp2 = await server.sendTransaction(prepared2);
  let r2 = await server.getTransaction(resp2.hash);
  while (r2.status === 'NOT_FOUND') { await new Promise(z => setTimeout(z, 2000)); r2 = await server.getTransaction(resp2.hash); }
  const contractId = sdk.Address.fromScVal(getVal(meta2)).toString();
}
run();
