import { Box, Button, Input, Select, Spinner } from "@chakra-ui/react";
import { Signer } from "ethers";
import { ChangeEventHandler, useEffect, useState } from "react";
import { useAccount, useConnect, useSigner } from "wagmi";
import { useSuperfluid } from "../providers/Superfluid";

const DONATION_ADDRESS =
  process.env.NEXT_PUBLIC_DONATION_ADDRESS ??
  "0x8790B75CF2bd36A2502a3e48A24338D8288f2F15";

if (!process.env.NEXT_PUBLIC_DONATION_CHAIN_ID) {
  throw new Error("Missing DONATION_CHAIN_ID");
}

const DONATION_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_DONATION_CHAIN_ID);

export const DonateButton = () => {
  const { isConnected, isConnecting, address } = useAccount();
  const { data } = useSigner();
  const { connect, connectors } = useConnect();
  const { superTokens, sf } = useSuperfluid();
  const [selectedSuperToken, setSelectedSuperToken] = useState("");
  const [flowRate, setFlowRate] = useState("0");
  const connector = connectors[0];
  const [userBalance, setUserBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const disableDonate =
    !selectedSuperToken || !flowRate || loadingBalance || userBalance === "0";

  useEffect(() => {
    if (!sf || !selectedSuperToken) {
      return;
    }

    async function fetchUserBalance() {
      if (!sf || !address) {
        return;
      }
      setLoadingBalance(true);
      const superToken = await sf.loadSuperToken(selectedSuperToken);
      const balance = await superToken.balanceOf({
        account: address,
        providerOrSigner: data?.provider!,
      });
      setUserBalance(balance);
      setLoadingBalance(false);
    }

    fetchUserBalance();
  }, [address, sf, selectedSuperToken, data]);

  const handleDonate = () => {
    if (!sf || !selectedSuperToken || !flowRate) {
      return;
    }

    const res = sf.cfaV1.createFlow({
      sender: address,
      receiver: DONATION_ADDRESS,
      superToken: selectedSuperToken,
      flowRate,
    });
    res.exec(data as Signer).catch(console.error);
  };

  const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setSelectedSuperToken(e.target.value);
  };

  const handleFlowRateChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { value },
  }) => {
    const value_ = Number(value);
    if (isNaN(value_)) {
      return;
    }

    setFlowRate(value_.toString());
  };

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      <Box display="flex" gap={3}>
        {isConnected && (
          <Select
            placeholder="Select super token"
            onChange={handleSelectChange}
          >
            {superTokens.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >{`${s.name} (${s.symbol})`}</option>
            ))}
          </Select>
        )}

        {selectedSuperToken && (
          <Input
            type="number"
            placeholder="Enter a flow rate in wei/second"
            onChange={handleFlowRateChange}
          />
        )}
      </Box>

      <Box
        width="100%"
        display="flex"
        justifyContent="flex-end"
        flexDirection="column"
      >
        {!isConnected ? (
          <Button
            onClick={() =>
              connect({ chainId: DONATION_CHAIN_ID, connector: connector })
            }
          >
            {isConnecting ? (
              <>
                <Spinner marginRight={2} />
                Connecting...
              </>
            ) : (
              "Connect to donate"
            )}
          </Button>
        ) : (
          <Button
            _hover={{ backgroundColor: "##8AFF8A" }}
            backgroundColor="#00D100"
            color="white"
            disabled={disableDonate}
            onClick={handleDonate}
          >
            {loadingBalance ? (
              <>
                <Spinner marginRight={2} />
                Fetching super token balance...
              </>
            ) : (
              "Donate"
            )}
          </Button>
        )}
        {!!selectedSuperToken && !loadingBalance && (
          <Box color="grey">
            You have {userBalance}{" "}
            {superTokens.find((t) => selectedSuperToken === t.id)!.symbol}
          </Box>
        )}
      </Box>
    </Box>
  );
};
