import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  IndianRupee,
  BookOpen,
  Clock,
  CheckCircle
} from "lucide-react";

export default function RetailerLedger() {
  const navigate = useNavigate();
  const { distributorId } = useParams();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    ordered: 0,
    paid: 0,
    outstanding: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {

    const shop = localStorage.getItem("retailer_shop");
    const phone = localStorage.getItem("retailer_phone");

    if (!shop || !phone) {
      alert("Retailer not found");
      navigate(-1);
      return;
    }

    setLoading(true);

    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("distributor_id", distributorId)
      .eq("retailer_shop", shop)
      .eq("retailer_phone", phone)
      .order("created_at", { ascending: false });

    const { data: paymentData } = await supabase
      .from("payments")
      .select("*")
      .eq("distributor_id", distributorId)
      .eq("retailer_shop", shop)
      .eq("retailer_phone", phone)
      .order("created_at", { ascending: false });

    const totalOrders = (orderData || []).reduce(
      (s, o) => s + Number(o.total_amount || 0),
      0
    );

    const totalPaid = (paymentData || []).reduce(
      (s, p) => s + Number(p.amount || 0),
      0
    );

    setOrders(orderData || []);
    setPayments(paymentData || []);

    setSummary({
      ordered: totalOrders,
      paid: totalPaid,
      outstanding: totalOrders - totalPaid
    });

    setLoading(false);
  }
    if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading ledger...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 className="font-bold text-xl">
          My Ledger
        </h1>

        <div />
      </div>

      <div className="max-w-3xl mx-auto p-5">

        <div className="bg-white rounded-xl shadow p-5 mb-6">

          <h2 className="font-bold text-lg mb-5">
            Account Summary
          </h2>

          <div className="grid grid-cols-3 gap-4">

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="font-bold text-xl flex items-center gap-1">
                <IndianRupee size={18}/>
                {summary.ordered}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="font-bold text-xl text-green-700 flex items-center gap-1">
                <IndianRupee size={18}/>
                {summary.paid}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Outstanding</p>
              <p className="font-bold text-xl text-red-600 flex items-center gap-1">
                <IndianRupee size={18}/>
                {summary.outstanding}
              </p>
            </div>

          </div>

        </div>

        <div className="bg-white rounded-xl shadow p-5 mb-6">

          <h2 className="font-bold text-lg mb-4">
            Previous Orders
          </h2>

          {orders.length === 0 ? (

            <p className="text-gray-400">
              No orders yet.
            </p>

          ) : (

            orders.map(order => (

              <div
                key={order.id}
                className="border rounded-lg p-4 mb-3"
              >

                <div className="flex justify-between">

                  <div>

                    <p className="font-semibold">
                      ₹{order.total_amount}
                    </p>

                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>

                  </div>

                  <div className="flex items-center gap-2">

                    {order.status === "delivered" ? (
                      <CheckCircle
                        size={18}
                        className="text-green-600"
                      />
                    ) : (
                      <Clock
                        size={18}
                        className="text-yellow-600"
                      />
                    )}

                    <span className="capitalize">
                      {order.status}
                    </span>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

        <div className="bg-white rounded-xl shadow p-5">

          <h2 className="font-bold text-lg mb-4">
            Payment History
          </h2>

          {payments.length === 0 ? (

            <p className="text-gray-400">
              No payments recorded.
            </p>

          ) : (

            payments.map(payment => (

              <div
                key={payment.id}
                className="border rounded-lg p-4 mb-3 flex justify-between"
              >

                <div>

                  <p className="font-semibold">
                    ₹{payment.amount}
                  </p>

                  <p className="text-sm text-gray-500">
                    {payment.note || "Payment received"}
                  </p>

                </div>

                <div className="text-sm text-gray-500">

                  {new Date(payment.created_at).toLocaleDateString("en-IN")}

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  )
}