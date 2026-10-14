import { useState } from "react";
import App from "./App";
import SignIn from "./SignIn";

export default function AuthGate() {
  const [user, setUser] = useState<string | null>(() =>
    sessionStorage.getItem("expenseTrackerUser")
  );

  function handleSignIn(name: string) {
    sessionStorage.setItem("expenseTrackerUser", name);
    setUser(name);
  }

  function handleSignOut() {
    sessionStorage.removeItem("expenseTrackerUser");
    setUser(null);
  }

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return <App onSignOut={handleSignOut} />;
}
