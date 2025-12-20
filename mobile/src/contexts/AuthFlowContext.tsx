import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";
import {
  useLoginWithEmail,
  useLoginWithSMS,
  type LoginWithEmailHookResult,
  type LoginWithSMSHookResult,
} from "@privy-io/expo";

interface AuthFlowContextType {
  // Email auth
  emailAuth: LoginWithEmailHookResult;
  // SMS auth
  smsAuth: LoginWithSMSHookResult;
  // Track current flow
  authType: "email" | "phone" | null;
  setAuthType: (type: "email" | "phone" | null) => void;
  // Contact info
  contactInfo: string;
  setContactInfo: (info: string) => void;
}

const AuthFlowContext = createContext<AuthFlowContextType | undefined>(
  undefined
);

export const AuthFlowProvider = ({ children }: { children: ReactNode }) => {
  const [authType, setAuthType] = useState<"email" | "phone" | null>("phone");
  const [contactInfo, setContactInfo] = useState("");
  const emailAuth = useLoginWithEmail();
  const smsAuth = useLoginWithSMS();

  return (
    <AuthFlowContext.Provider
      value={{
        emailAuth,
        smsAuth,
        authType,
        setAuthType,
        contactInfo,
        setContactInfo,
      }}
    >
      {children}
    </AuthFlowContext.Provider>
  );
};

export const useAuthFlow = () => {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error("useAuthFlow must be used within AuthFlowProvider");
  }
  return context;
};
