import algosdk from 'algosdk';

export const sendToBlockchain = async (senderAddress: string, dataString: string) => {
  const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
  const params = await client.getTransactionParams().do();
  
  const encoder = new TextEncoder();
  const note = encoder.encode(dataString);
  const hash = dataString; // As per user code, hash is just the string passed

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: senderAddress,
    receiver: senderAddress,
    amount: 0,
    note: note,
    suggestedParams: params,
  });

  return { txn, hash };
};
