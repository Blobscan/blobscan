import { Framework, ISuperToken } from "@superfluid-finance/sdk-core";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useProvider } from "wagmi";

if (!process.env.NEXT_PUBLIC_DONATION_CHAIN_ID) {
  throw new Error("Missing DONATION_CHAIN_ID");
}

const DONATION_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_DONATION_CHAIN_ID);
type SuperfluidContextProps = {
  sf: Framework | undefined;
  isLoading: boolean;
  superTokens: ISuperToken[];
};

const SuperfluidContext = createContext({} as SuperfluidContextProps);

export const Superfluid = ({ children }: { children: ReactNode }) => {
  const provider = useProvider();
  const [sf, setSf] = useState<Framework | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [superTokens, setSuperTokens] = useState<ISuperToken[]>([]);

  useEffect(() => {
    if (sf || (!sf && !provider)) {
      return;
    }
    const createSuperfluid = async () => {
      setIsLoading(true);
      try {
        const sfClient = await Framework.create({
          chainId: DONATION_CHAIN_ID,
          provider,
        });
        const superTokens = await sfClient.query.listAllSuperTokens({
          isListed: true,
        });
        setSuperTokens(superTokens.data);
        setSf(sfClient);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    createSuperfluid();
  }, [sf, provider]);

  return (
    <SuperfluidContext.Provider value={{ sf, isLoading, superTokens }}>
      {children}
    </SuperfluidContext.Provider>
  );
};

export const useSuperfluid = () => {
  return useContext(SuperfluidContext);
};
