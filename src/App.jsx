import { useState, useEffect } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import "./index.css";
import config from "./Constants/config.json";
import { useAccount, useConnectors } from "@starknet-react/core";
import { ethers, toBeHex } from "ethers";

function App() {
  const { address, status } = useAccount();
  const { connect, connectors, disconnect, refresh } = useConnectors();
  const {
    enableWeb3,
    account,
    isWeb3Enabled,
    isWeb3EnableLoading,
    deactivateWeb3,
    Moralis,

    chainId: chainIdHex,
  } = useMoralis();
  const userChainId = parseInt(chainIdHex);
  const [inputValue, setInputValue] = useState("0");
  const [metamaskBalance, setMetamaskBalance] = useState(0);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // useEffect(() => {
  //   if (isWeb3Enabled) return;
  //   if (window.localStorage.getItem("connected")) enableWeb3();
  // }, [isWeb3Enabled]);

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      if (account == null) {
        window.localStorage.removeItem("connected");
        deactivateWeb3();
      }
    });
  }, []);
  // SEND TO STARKNET TX
  const {
    runContractFunction: send,
    data: enterTxResponse,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: config.abi,
    contractAddress: config.contractAddress,
    functionName: config.depositFunctionName,
    msgValue:
      BigInt(ethers.parseEther(inputValue ? inputValue : "0")) +
      BigInt(ethers.parseEther("0.00005")),
    params: [
      BigInt(ethers.parseEther(inputValue ? inputValue : "0")) +
        BigInt(ethers.parseEther("0.00005")),
      address,
    ],
  });
  // console.log(ethers.parseEther("0.21"));
  console.log(
    BigInt(ethers.parseEther(inputValue ? inputValue : "0")) +
      BigInt(ethers.parseEther("0.00005"))
  );
  //ARGENTX OR BRAAVOS CONNECTION
  const renderStarknetConnect = () => {
    if (status === "connected") {
      return (
        <>
          <button className="connect-button">
            {address.slice(0, 5)}...{address.slice(address.length - 3)}
          </button>
          <button
            onClick={async () => {
              await disconnect();
            }}
          >
            X
          </button>
        </>
      );
    }
    if (status === "disconnected") {
      return (
        <>
          <button
            onClick={() => {
              window.starknet_argentX
                ? connect(connectors[0])
                : console.log("get argent");
            }}
            className="connect-button"
          >
            Connect Starknet Wallet
          </button>
        </>
      );
    }
  };

  //METAMASK CONNECTION
  const renderMetamaskConnect = () => {
    if (isWeb3EnableLoading) {
      return <button>Loading</button>;
    }
    if (!account) {
      return (
        <button
          className="connect-button"
          onClick={async () => {
            await enableWeb3();
            window.localStorage.setItem("connected", "injected");
          }}
        >
          Connect Ethereum Wallet
        </button>
      );
    }
    if (account) {
      return (
        <>
          <button className="connect-button">
            {account.slice(0, 6)}...{account.slice(account.length - 4)}
          </button>
          <button
            onClick={async () => {
              await deactivateWeb3();
            }}
          >
            X
          </button>
        </>
      );
    }
  };
  //SEND BUTTON
  const renderSendButton = () => {
    if (!account || !address) {
      return <button className="send-button">Connect Wallet</button>;
    }
    if (userChainId !== 1) {
      return (
        <button className="send-button">
          Please Switch to Ethereum Mainnet
        </button>
      );
    }
    if (inputValue >= metamaskBalance) {
      return <button className="send-button">Balance Exceeded !</button>;
    } else
      return (
        <button onClick={async () => send()} className="send-button">
          Send
        </button>
      );
  };

  //AMOUNT INPUT CONTROL
  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    const regex = /^[0-9.]*$/;

    if (regex.test(inputValue)) {
      setInputValue(inputValue);
    }
  };

  // FETCH ETHER BALANCE MAINNET
  useEffect(() => {
    const getEtherBalance = async () => {
      if (account) {
        const provider = new ethers.BrowserProvider(window.ethereum);

        const walletAddress = account;

        try {
          const balance = await provider.getBalance(walletAddress);

          const etherBalance = ethers.formatEther(balance);
          setMetamaskBalance(etherBalance);
        } catch (error) {
          console.log("Error fetching balance:", error);
        }
      }
    };
    getEtherBalance();
  }, [account, chainIdHex]);

  return (
    <>
      <div className="header">
        <div className="connect-container">{renderStarknetConnect()}</div>
        <div className="connect-container">{renderMetamaskConnect()}</div>
      </div>
      <div className="container">
        <div className="box">
          <div className="from">
            <div className="start">
              <h1>From: Ethereum Mainnet</h1>
              <div className="balance">Balance:{metamaskBalance}</div>
            </div>
            <input
              className="input"
              value={inputValue}
              onChange={handleInputChange}
            ></input>
          </div>
          <div className="to">
            <h1>To: Starknet</h1>
            {renderSendButton()}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
