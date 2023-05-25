import { useState, useEffect } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import "./index.css";
import config from "./Constants/config.json";
import { useAccount, useConnectors } from "@starknet-react/core";
import { ethers } from "ethers";
import { ReactComponent as BraavosLogo } from "./assets/braavos.svg";
import { ReactComponent as ArgentXLogo } from "./assets/argentx.svg";
import { ReactComponent as EthLogo } from "./assets/eth.svg";
import { ReactComponent as StarknetLogo } from "./assets/starknet.svg";
import { ReactComponent as SignoutIcon } from "./assets/signout.svg";
import onnitLogo from "./assets/onnit.webp";
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
  const [inputValue, setInputValue] = useState("");
  const [metamaskBalance, setMetamaskBalance] = useState("0");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
  const userValue = ethers.utils.parseEther(inputValue ? inputValue : "0");
  const addedWei = ethers.utils.parseUnits("1", "wei");
  const total = userValue.add(addedWei);
  const bigIntAddress = address ? BigInt(address) : "";
  // TX CALL
  const {
    runContractFunction: send,
    data: enterTxResponse,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: config.abi,
    contractAddress: config.contractAddress,
    functionName: config.depositFunctionName,
    msgValue: total,
    params: {
      amount: userValue,
      l2Recipient: bigIntAddress,
    },
  });

  //ARGENTX OR BRAAVOS CONNECTION
  const renderStarknetConnect = () => {
    const handleDropdownOpen = () => {
      setIsDropdownOpen(true);
    };

    const handleDropdownClose = () => {
      setIsDropdownOpen(false);
    };
    if (status === "connected") {
      return (
        <>
          <button className="connect-button">
            {address.slice(0, 5)}...{address.slice(address.length - 3)}
            <i
              onClick={() => {
                disconnect();
              }}
            >
              <SignoutIcon></SignoutIcon>
            </i>
          </button>
        </>
      );
    }
    if (status === "disconnected") {
      return (
        <div className="starknet-container">
          <div
            className="starknet-connectors"
            onMouseEnter={handleDropdownOpen}
            onMouseLeave={handleDropdownClose}
          >
            Connect Starknet Wallet
            {isDropdownOpen && (
              <div className="starknet-dropdown">
                <button
                  onClick={() => {
                    window.starknet_argentX
                      ? connect(connectors[0])
                      : console.log("get argent");
                  }}
                  className="connect-button-stark"
                >
                  <ArgentXLogo></ArgentXLogo>
                  Argent X
                </button>
                <button
                  onClick={() => {
                    window.starknet_braavos
                      ? connect(connectors[1])
                      : console.log("get braavos");
                  }}
                  className="connect-button-stark"
                >
                  <BraavosLogo></BraavosLogo>
                  Braavos
                </button>
              </div>
            )}
          </div>
        </div>
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
            <i
              onClick={async () => {
                await deactivateWeb3();
              }}
            >
              <SignoutIcon></SignoutIcon>
            </i>
          </button>
        </>
      );
    }
  };
  //SEND BUTTON
  const renderSendButton = () => {
    if (!account || !address) {
      return <button className="send-button send-error">Connect Wallet</button>;
    }
    if (userChainId !== 1) {
      return (
        <button className="send-button send-error">
          Please Switch to Ethereum Mainnet
        </button>
      );
    }
    if (!inputValue || inputValue <= 0)
      return (
        <button className="send-button send-error">Enter a valid amount</button>
      );
    if (inputValue >= metamaskBalance) {
      return (
        <button className="send-button send-error">Balance Exceeded !</button>
      );
    } else
      return (
        <button
          onClick={async () =>
            send({
              onSuccess: console.log("sccs"),
              onError: (e) => console.log(e),
            })
          }
          className="send-button"
        >
          Send
        </button>
      );
  };

  //AMOUNT INPUT CONTROL
  const handleInputChange = (event) => {
    let inputValue = event.target.value;
    inputValue = inputValue.replace(/[^0-9.]/g, "");
    inputValue = inputValue.replace(/^0+(?=\d)/, "");
    inputValue = inputValue.replace(/(\..*)\./g, "$1");
    setInputValue(inputValue);
  };

  // FETCH ETHER BALANCE MAINNET
  useEffect(() => {
    const getEtherBalance = async () => {
      if (account) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        const walletAddress = account;

        try {
          const balance = await provider.getBalance(walletAddress);

          const etherBalance = ethers.utils.formatEther(balance);
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
        <img src={onnitLogo}></img>
        <div className="header-buttons">
          <div className="connect-container">{renderStarknetConnect()}</div>
          <div className="connect-container">{renderMetamaskConnect()}</div>
        </div>
      </div>
      <div className="container">
        <div className="box">
          <div className="from">
            <div className="start">
              <h1>
                From: Ethereum Mainnet <EthLogo></EthLogo>
              </h1>
              <div
                onClick={() =>
                  setInputValue(String(Number(metamaskBalance) - 0.00005))
                }
                className="balance"
              >
                Balance:{metamaskBalance.slice(0, 8)}
              </div>
            </div>
            <input
              className="input"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="0.0"
            ></input>
          </div>
          <div className="to">
            <h1>
              To: Starknet <StarknetLogo></StarknetLogo>
            </h1>
            {renderSendButton()}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
