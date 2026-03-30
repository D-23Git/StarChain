import * as sdkNamespace from '@stellar/stellar-sdk';
const sdk = sdkNamespace.default || sdkNamespace;
const SorobanRpc = sdk.SorobanRpc || sdk.rpc || sdk.default?.SorobanRpc;
const { TransactionBuilder, Networks, Keypair, Contract, Address, nativeToScVal } = sdk;
import { readFileSync, writeFileSync } from 'fs';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const server = new SorobanRpc.Server(RPC_URL);

async function deploy() {
  console.log('🚀 V8: Final Guaranteed Deployment...');
  const kp = Keypair.random();
  console.log('🔑 Deployer:', kp.publicKey());
  
  await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
  console.log('💰 Funded');

  // Load WASM from inner build
  let wasm;
  try {
    wasm = readFileSync('./target/wasm32-unknown-unknown/release/starchain_reviews.wasm');
  } catch {
    try {
      wasm = readFileSync('./target/wasm32v1-none/release/starchain_reviews.wasm');
    } catch {
       wasm = readFileSync('./contract/target/wasm32v1-none/release/starchain_reviews.wasm');
    }
  }

  
  const source = await server.getAccount(kp.publicKey());
  const tx = new TransactionBuilder(source, { fee: '10000', networkPassphrase: Networks.TESTNET })
    .addOperation(sdk.Operation.uploadContractWasm({ wasm }))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(kp);
  const result = await server.sendTransaction(prepared);
  
  let r = await server.getTransaction(result.hash);
  while (r.status === 'NOT_FOUND') {
    await new Promise(res => setTimeout(res, 2000));
    r = await server.getTransaction(result.hash);
  }
  
  const metaStr = r.resultMetaXdr || r.meta || r.result_meta_xdr;
  const meta = typeof metaStr === 'string' ? sdk.xdr.TransactionMeta.fromXDR(metaStr, 'base64') : metaStr;
  
  // Robustly extract return value from any meta version
  const getReturnValue = (m) => {
    try {
      if (m.v3) return m.v3().sorobanMeta().returnValue() || m.v3().returnValue();
      if (m.v2) return m.v2().sorobanMeta().returnValue() || m.v2().returnValue();
      if (m.v1) return m.v1().sorobanMeta().returnValue() || m.v1().returnValue();
      if (m.v0) return m.v0().sorobanMeta().returnValue() || m.v0().returnValue();
      return m.returnValue || m;
    } catch(e) { 
      console.log('--- RETURN VALUE FALLBACK ---');
      return m; 
    }
  };

  const val1 = getReturnValue(meta);
  const wasmId = val1.bytes().toString('hex');
  console.log('✅ WASM ID:', wasmId);

  const source2 = await server.getAccount(kp.publicKey());
  const tx2 = new TransactionBuilder(source2, { fee: '10000', networkPassphrase: Networks.TESTNET })
    .addOperation(sdk.Operation.createContract({ wasmId, address: kp.publicKey() }))
    .setTimeout(60)
    .build();

  const prepared2 = await server.prepareTransaction(tx2);
  prepared2.sign(kp);
  const result2 = await server.sendTransaction(prepared2);
  
  let r2 = await server.getTransaction(result2.hash);
  while (r2.status === 'NOT_FOUND') {
    await new Promise(res => setTimeout(res, 2000));
    r2 = await server.getTransaction(result2.hash);
  }
  
  const metaStr2 = r2.resultMetaXdr || r2.meta || r2.result_meta_xdr;
  const meta2 = typeof metaStr2 === 'string' ? sdk.xdr.TransactionMeta.fromXDR(metaStr2, 'base64') : metaStr2;
  const val2 = getReturnValue(meta2);
  const contractId = sdk.Address.fromScVal(val2).toString();
  console.log('✅ FINAL ID:', contractId);
  writeFileSync('contract_id.txt', contractId);
  writeFileSync('../contract_id.txt', contractId);
}

deploy().catch(e => {
  console.error('❌ FAIL:', e);
  process.exit(1);
});

