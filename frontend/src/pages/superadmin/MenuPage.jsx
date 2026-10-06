import { useAuth } from "../../context/AuthContext";
import MenuTab from "../admin/MenuTab";
import { PageTitle } from "./ui";
import TakeOrder from "./TakeOrder";

// Super admin: add / edit / hide menu items.
// Manager and captain: the menu to take table and room orders from (no online orders here).
export default function MenuPage() {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") {
    return (
      <>
        <PageTitle title="Menu" sub="Add, edit, hide or delete the items customers see" />
        <MenuTab />
      </>
    );
  }
  return (
    <>
      <PageTitle title="Menu" sub="Choose a table or room and add items - each item goes straight to the kitchen (KOT)" />
      <TakeOrder allowOnline={false} />
    </>
  );
}
