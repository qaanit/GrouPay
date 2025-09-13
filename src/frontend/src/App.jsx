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

}