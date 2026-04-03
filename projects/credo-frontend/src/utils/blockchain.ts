import algosdk from 'algosdk';

export const sendToBlockchain = async (
  senderAddress: string,
  receiverAddress: string,
  amountAlgos: number,
  dataString: string
) => {
  const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
  const params = await client.getTransactionParams().do();
  
  const encoder = new TextEncoder();
  const note = encoder.encode(dataString);
  const hash = dataString; // As per user code, hash is just the string passed

  // Convert ALGO to microAlgos (1 ALGO = 1,000,000 microAlgos)
  const amountMicroAlgos = Math.floor(amountAlgos * 1000000);

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: senderAddress,
    receiver: receiverAddress,
    amount: amountMicroAlgos,
    note: note,
    suggestedParams: params,
  });

  return { txn, hash };
};
