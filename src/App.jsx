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
import { motion } from "framer-motion";

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
  const [gasPrice, setGasPrice] = useState(0);
  const [chainSelection, setchainSelection] = useState("starknet");
  const [metamaskBalance, setMetamaskBalance] = useState("0");
  const [isStarknetDropdownOpen, setisStarknetDropdownOpen] = useState(false);
  const [isChainDropdownOpen, setisChainDropdownOpen] = useState(false);
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      if (account == null) {
        window.localStorage.removeItem("connected");
        deactivateWeb3();
        console.log("account null");
      }
    });
    Moralis.onWeb3Enabled((result) => {});
    Moralis.onChainChanged((chain) => {});
  }, []);

  // STARKNET WALLET CONNECTION REFRESH
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // METAMASK WALLET CONNECTION TRACKER
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

  const {
    runContractFunction: send,
    data: enterTxResponseStark,
    isLoadingStark,
    isFetchingStark,
  } = useWeb3Contract({
    abi: config.starkGateAbi,
    contractAddress: config.starkGateContractAddress,
    functionName: config.starkGateDepositFunctionName,
    msgValue: total,
    params: {
      amount: userValue,
      l2Recipient: bigIntAddress,
    },
  });
  //  SEND TO ZKSync Era TX
  const calculate_zk_fee = (((17 * gasPrice + 799) / 800) * 243884) / 10 ** 18;
  const zkUserValue = ethers.utils.parseEther(inputValue ? inputValue : "0");
  const zkAddedWei = ethers.utils.parseUnits(
    calculate_zk_fee.toFixed(18),
    "ether"
  );
  const Zktotal = zkUserValue.add(zkAddedWei);

  const {
    runContractFunction: sendZks,
    data: enterTxResponseZks,
    isLoadingZks,
    isFetchingZks,
  } = useWeb3Contract({
    abi: config.zkBridgeAbi,
    contractAddress: config.zkBridgeContractAddress,
    functionName: config.zkBridgeDepositFunctionName,
    msgValue: "",
    params: {
      _contractL2: account,
      _l2Value: zkUserValue,
      _calldata: "0x00",
      _l2GasLimit: 243885,
      _l2GasPerPubdataByteLimit: 800,
      _factoryDeps: [],
      _refundRecipient: account,
    },
  });

  //ARGENTX OR BRAAVOS CONNECTION
  const renderStarknetConnect = () => {
    const handleDropdownOpen = () => {
      setisStarknetDropdownOpen(true);
    };

    const handleDropdownClose = () => {
      setisStarknetDropdownOpen(false);
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
            {isStarknetDropdownOpen && (
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
      return <button className="connect-button">Loading..</button>;
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
    if (!account || (!address && chainSelection === "starknet")) {
      return (
        <button
          onClick={async () => {
            await enableWeb3();
            if (chainSelection === "starknet") {
              window.starknet_argentX
                ? connect(connectors[0])
                : window.starknet_braavos
                ? connect(connectors[1])
                : console.log("no starknet wallet :/");
            }
          }}
          className="send-button send-error"
        >
          Connect Wallet
        </button>
      );
    }
    if (userChainId !== 1) {
      return (
        <button
          onClick={async () => await Moralis.switchNetwork(1)}
          className="send-button send-error"
        >
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
            chainSelection === "starknet"
              ? sendStark({
                  onError: (e) => console.log(e),
                })
              : sendZks({
                  onError: (e) => console.log(e),
                })
          }
          className="send-button"
        >
          Send
        </button>
      );
  };
  // CHAIN SELECTOR BUTTON
  const renderChainButton = () => {
    const handleDropdown = () => {
      setisChainDropdownOpen(!isChainDropdownOpen);
    };

    const starknetButton = (
      <button
        onClick={() => {
          setchainSelection("starknet");
          handleDropdown();
          console.log("chain id changed: starknet");
        }}
        className="chain-button"
      >
        Starknet <StarknetLogo></StarknetLogo>
      </button>
    );

    const zksyncEraButton = (
      <button
        onClick={() => {
          setchainSelection("zksyncEra");
          handleDropdown();
          console.log("chain id changed: era");
        }}
        className="chain-button"
      >
        ZkSync Era
        <BraavosLogo></BraavosLogo>
      </button>
    );

    return (
      <div className="chain-options" onClick={handleDropdown}>
        {chainSelection === "starknet" ? starknetButton : zksyncEraButton}
        {isChainDropdownOpen && (
          <div className="chain-dropdown">
            {starknetButton}
            {zksyncEraButton}
          </div>
        )}
      </div>
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

  // ESTIMATE GAS
  useEffect(() => {
    const interval = setInterval(async () => {
      const receipt = await provider.getFeeData();
      const gasPrice = receipt.gasPrice;
      const maxPriorityFeePerGas = receipt.maxPriorityFeePerGas;
      const lastBaseFeePerGas = receipt.lastBaseFeePerGas;
      const maxFeePerGas = receipt.maxFeePerGas;
      setGasPrice(gasPrice);
      console.log("gasPrice : ", ethers.utils.formatUnits(gasPrice, "wei"));
      console.log(
        "maxPriorityFeePerGas: ",
        ethers.utils.formatUnits(maxPriorityFeePerGas, "wei")
      );
      console.log(
        "lastBaseFeePerGas ",
        ethers.utils.formatUnits(lastBaseFeePerGas, "wei")
      );
      console.log(
        "maxFeePerGas: ",
        ethers.utils.formatUnits(maxFeePerGas, "wei")
      );
      console.log(chainSelection);
      console.log(await provider.getFeeData());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

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
                onClick={() => setInputValue(metamaskBalance)}
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
            <div className="chain-container">
              <h1>To : </h1>
              {renderChainButton()}
            </div>

            {renderSendButton()}
          </div>
        </div>
      </div>
      <motion.a
        target="_blank"
        rel="noopener noreferrer"
        href="https://twitter.com/codeesura"
        drag
        className="social codeesura"
      ></motion.a>
      <motion.a
        target="_blank"
        rel="noopener noreferrer"
        href="https://twitter.com/YAA_HAWK"
        drag
        className="social hwk"
      ></motion.a>
    </>
  );
}

export default App;
