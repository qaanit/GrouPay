import { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000"; // backend

function App() {
  const [step, setStep] = useState(1);
  const [groupId] = useState("demo-group");
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });
  const [newMember, setNewMember] = useState("");
  const [totals, setTotals] = useState({});

  // Receipt Upload
  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    setItems([...items, { ...newItem, price: parseFloat(newItem.price) }]);
    setNewItem({ name: "", price: "" });
  };

  const uploadReceipt = async () => {
    await axios.post(`${API}/receipt/${groupId}`, { items });
    setStep(2);
  };

  // Group Setup
  const addMember = () => {
    if (!newMember) return;
    setMembers([...members, newMember]);
    setNewMember("");
  };

  const createGroup = async () => {
    await axios.post(`${API}/group/${groupId}`, { members });
    setStep(3);
  };

// Phase 3: Assign Items
  const assignItem = async (itemIndex, member) => {
    await axios.post(`${API}/assign/${groupId}`, {
      item_index: itemIndex,
      members: [member],
    });
    fetchTotals();
  };

  const fetchTotals = async () => {
    const res = await axios.get(`${API}/bill/${groupId}`);
    setTotals(res.data.totals);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Group Bill Splitter 💸</h1>

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
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
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

      {step === 3 && (
        <div>
          <h2>Step 3: Assign Items</h2>
          <ul>
            {items.map((it, i) => (
              <li key={i}>
                {it.name} - R{it.price}
                <div>
                  {members.map((m) => (
                    <button key={m} onClick={() => assignItem(i, m)}>
                      Assign to {m}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <button onClick={fetchTotals}>Refresh Totals</button>
          <h3>Totals</h3>
          <ul>
            {Object.entries(totals).map(([m, total]) => (
              <li key={m}>
                {m}: R{total.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;