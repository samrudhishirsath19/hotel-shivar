import { useState } from "react";
import useBoard from "./useBoard";
import { useAuth } from "../../context/AuthContext";
import { canSee, can } from "../../roles";
import { usePanel } from "./panelContext";
import { PageTitle } from "./ui";
import TakeOrder from "./TakeOrder";
import OrdersBoard from "./OrdersBoard";

// Kitchen Order Tickets: new orders -> Ready for Serving/Shipping -> sent to Billing.
// (Payment is not done here - it is in Billing.)
export default function KotPage() {
  const boardState = useBoard();
  const [showNew, setShowNew] = useState(false);
  const { user } = useAuth();
  const { base } = usePanel();
  const role = user?.role;
  // each button follows its own permission (Module Access)
  const perms = {
    ready: can(role, "KOT_READY"),
    sendToBilling: can(role, "SEND_TO_BILLING"),
    cancel: can(role, "ORDER_CANCEL"),
    accept: can(role, "ONLINE_MANAGE"),
  };
  const takeOrders = can(role, "ORDER_TAKING");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="KOT"
          sub={perms.ready && !takeOrders
            ? "New orders appear here automatically. Press Mark Ready when an order is made."
            : "Kitchen order tickets - refreshes every few seconds"}
        />
        {takeOrders && (
          <button onClick={() => setShowNew((s) => !s)} className="px-5 py-2 rounded-full bg-[#B8893C] text-white text-sm font-bold">
            {showNew ? "Close new order" : "＋ New order"}
          </button>
        )}
      </div>

      {takeOrders && showNew && <TakeOrder allowOnline={role === "SUPER_ADMIN"} onClose={() => setShowNew(false)} onChanged={boardState.reload} />}
      <OrdersBoard
        boardState={boardState}
        perms={perms}
        showBilled={perms.sendToBilling || canSee(role, "billing")}
        billingPath={canSee(role, "billing") ? `${base}/billing` : undefined}
      />
    </div>
  );
}
