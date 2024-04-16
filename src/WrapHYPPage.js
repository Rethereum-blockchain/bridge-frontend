
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import BN from 'bn.js'; // Import the BN library

// ABI for Wrapped HYP (wHYP) contract
const wHYPABI = [{"type":"event","name":"Approval","inputs":[{"type":"address","name":"from","internalType":"address","indexed":true},{"type":"address","name":"authorized","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Deposit","inputs":[{"type":"address","name":"destination","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Transfer","inputs":[{"type":"address","name":"from","internalType":"address","indexed":true},{"type":"address","name":"destination","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Withdrawal","inputs":[{"type":"address","name":"from","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"fallback","stateMutability":"payable"},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"allowance","inputs":[{"type":"address","name":"","internalType":"address"},{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"approve","inputs":[{"type":"address","name":"from","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"balanceOf","inputs":[{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint8","name":"","internalType":"uint8"}],"name":"decimals","inputs":[]},{"type":"function","stateMutability":"payable","outputs":[],"name":"deposit","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"name","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"symbol","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"totalSupply","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"transfer","inputs":[{"type":"address","name":"destination","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"transferFrom","inputs":[{"type":"address","name":"from","internalType":"address"},{"type":"address","name":"destination","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"withdraw","inputs":[{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"receive","stateMutability":"payable"}];
const wHYPContractAddress = '0x0000000000079c645A9bDE0Bd8Af1775FAF5598A'; // wHYP contract address

function WrapHYPPage() {
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState('');
  const [web3, setWeb3] = useState(null);
  const [wHYPContract, setwHYPContract] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      const contractInstance = new web3Instance.eth.Contract(wHYPABI, wHYPContractAddress);
      setwHYPContract(contractInstance);
    }
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setMessage("Wallet connected successfully.");
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setMessage("Failed to connect wallet. Please try again.");
    }
  };

  const handleDeposit = async () => {
    if (!amount || !web3 || !account) {
      setMessage("Please ensure all fields are correctly filled and wallet is connected.");
      return;
    }

    const weiAmount = web3.utils.toWei(amount, 'ether');

    try {
      const balance = await web3.eth.getBalance(account);

      if (new BN(balance).lt(new BN(weiAmount))) {
        setMessage("Insufficient HYP balance.");
        return;
      }

      setMessage("Initiating wrap transaction, please confirm in MetaMask...");
      const gasPrice = await web3.eth.getGasPrice();

      await wHYPContract.methods.deposit().send({ from: account, value: weiAmount, gasPrice });
      setMessage('Wrap successful! Please allow a few moments for the balance to update.');
    } catch (error) {
      console.error('Error wrapping:', error);
      setMessage(`Wrap failed: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !web3 || !wHYPContract || !account) {
      setMessage("Web3 or contract not initialized, or no account connected.");
      return;
    }

    const weiAmount = web3.utils.toWei(amount, 'ether');
    try {
      const wHYPBalance = await wHYPContract.methods.balanceOf(account).call();

      if (new BN(wHYPBalance).lt(new BN(weiAmount))) {
        setMessage("Insufficient wHYP balance.");
        return;
      }

      setMessage("Initiating unwrap transaction, please confirm in MetaMask...");
      const gasPrice = await web3.eth.getGasPrice();
      await wHYPContract.methods.withdraw(weiAmount).send({ from: account, gasPrice });
      setMessage('Unwrap successful! Please allow a few moments for the balance to update.');
    } catch (error) {
      console.error('Error unwrapping:', error);
      setMessage(`Unwrap failed: ${error.message}`);
    }
  };

  return (
    <div className="wrap-hyp-container" style={{ marginTop: "250px", textAlign: "center" }}>
      {!account ? (
        <button onClick={connectWallet} className="action-btn">Connect Wallet</button>
      ) : (
        <>
          <div>Welcome, {account.substring(0, 6)}...{account.substring(account.length - 4)}</div>
          <input 
            type="text" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="Amount to wrap" 
            className="input-field"
          />
          <div className="action-buttons">
            <button onClick={handleDeposit} className="action-btn">Wrap HYP</button>
            <button onClick={handleWithdraw} className="action-btn">Unwrap HYP</button>
          </div>
          {message && <div className="message-box">{message}</div>}
        </>
      )}
    </div>
  );
}

export default WrapHYPPage;