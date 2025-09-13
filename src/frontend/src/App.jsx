import { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";

const API = "http://127.0.0.1:8000"; // Backend URL

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/pay/:groupId/:member" element={<MemberPayPage />} />
      </Routes>
    </Router>
  );
}

// ----------------------
// Main App (Leader View)
// ----------------------
function MainApp() {
  const [step, setStep] = useState(1);
  const [groupId] = useState("demo-group");

  // Receipt & items
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });

  // Group members
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");

  // Assignments & totals
  const [assignments, setAssignments] = useState({});
  const [totals, setTotals] = useState({});
  const [payments, setPayments] = useState({});
  const [allPaid, setAllPaid] = useState(false);

  // ----------------------
  // Phase 2: Receipt
  // ----------------------
  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    setItems([...items, { ...newItem, price: parseFloat(newItem.price) }]);
    setNewItem({ name: "", price: "" });
  };

  const uploadReceipt = async () => {
    await axios.post(`${API}/receipt/${groupId}`, { items });
    setStep(2);
  };

  // ----------------------
  // Phase 2: Group members
  // ----------------------
  const addMember = () => {
    if (!newMember) return;
    setMembers([...members, newMember]);
    setNewMember("");
  };

  const createGroup = async () => {
    await axios.post(`${API}/group/${groupId}`, { members });
    const initialTotals = members.reduce((acc, m) => ({ ...acc, [m]: 0 }), {});
    setTotals(initialTotals);
    setStep(3);
  };

  // ----------------------
  // Phase 3: Assign items
  // ----------------------
  const assignItem = async (itemIndex, memberName) => {
    await axios.post(`${API}/assign/${groupId}`, {
      item_index: itemIndex,
      member: memberName,
    });
    const res = await axios.get(`${API}/bill/${groupId}`);
    setTotals(res.data.totals);
    setAssignments(res.data.assignments);
  };

  // ----------------------
  // Phase 4: Payments Dashboard
  // ----------------------
  const fetchDashboard = async () => {
    const res = await axios.get(`${API}/dashboard/${groupId}`);
    setTotals(res.data.totals);
    setAssignments(res.data.assignments);
    setPayments(res.data.payments);
    setAllPaid(res.data.all_paid);
  };

  useEffect(() => {
    if (step === 4) fetchDashboard();
  }, [step]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Group Bill Splitter 💸</h1>

      {/* Phase 1: Backend Test */}
      {step === 0 && (
        <div>
          <h2>Backend Test</h2>
          <button
            onClick={async () => {
              const res = await axios.get(API);
              alert(res.data.message);
            }}
          >
            Test Backend
          </button>
        </div>
      )}

      {/* Phase 2a: Receipt */}
      {step === 1 && (
        <div>
          <h2>Step 1: Enter Receipt Items</h2>
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) =>
              setNewItem({ ...newItem, price: e.target.value })
            }
          />
          <button onClick={addItem}>Add Item</button>

          <ul>
            {items.map((it, i) => (
              <li key={i}>
                {it.name} - R{it.price}
              </li>
            ))}
          </ul>

          <button onClick={uploadReceipt}>Upload Receipt</button>
        </div>
      )}

      {/* Phase 2b: Group members */}
      {step === 2 && (
        <div>
          <h2>Step 2: Add Group Members</h2>
          <input
            type="text"
            placeholder="Member name"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
          />
          <button onClick={addMember}>Add</button>

          <ul>
            {members.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>

          <button onClick={createGroup}>Create Group</button>
        </div>
      )}

      {/* Phase 3: Assign items */}
      {step === 3 && (
        <div>
          <h2>Step 3: Assign Items</h2>

          <ul>
            {items.map((it, i) => (
              <li key={i}>
                {it.name} - R{it.price}
                <div>
                  {members.map((m) => {
                    const assignedMember = assignments[i];
                    const isAssigned = assignedMember === m;
                    return (
                      <button
                        key={m}
                        style={{
                          margin: "0 5px",
                          backgroundColor: isAssigned ? "green" : "gray",
                          color: "white",
                        }}
                        onClick={() => assignItem(i, m)}
                      >
                        {isAssigned ? `Assigned to ${m}` : `Assign to ${m}`}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>

          <h3>Totals</h3>
          <ul>
            {Object.entries(totals).map(([m, total]) => (
              <li key={m}>
                {m}: R{total.toFixed(2)}
              </li>
            ))}
          </ul>

          <button onClick={() => setStep(4)}>Go to Payment Dashboard</button>
        </div>
      )}

      {/* Phase 4: Payment links */}
      {step === 4 && (
        <div>
          <h2>Step 4: Payment Links</h2>
          <ul>
            {members.map((m) => (
              <li key={m}>
                {m}:{" "}
                <a
                  href={`/pay/${groupId}/${m}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open payment page
                </a>{" "}
                - {payments[m] ? "Paid ✅" : "Pending"}
              </li>
            ))}
          </ul>

          {allPaid && <h3>All payments received! You can now settle the bill 💰</h3>}
        </div>
      )}
    </div>
  );
}

// ----------------------
// Member Payment Page
// ----------------------
function MemberPayPage() {
  const { groupId, member } = useParams();
  const [paid, setPaid] = useState(false);
  const [amount, setAmount] = useState(0);

  const fetchAmount = async () => {
    const res = await axios.get(`${API}/dashboard/${groupId}`);
    setAmount(res.data.totals[member] || 0);
    setPaid(res.data.payments[member]);
  };

  useEffect(() => {
    fetchAmount();
  }, []);

  const handlePay = async () => {
    await axios.post(`${API}/pay/${groupId}`, { member });
    setPaid(true);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Payment Page</h2>
      <p>
        {member} owes: R{amount.toFixed(2)}
      </p>
      {paid ? (
        <p>Paid ✅</p>
      ) : (
        <button onClick={handlePay}>Pay</button>
      )}
    </div>
  );
}

export default App;
