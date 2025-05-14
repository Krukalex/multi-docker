import { useState, useEffect } from "react";
import axios from "axios";

const Fib = () => {
  const [index, setIndex] = useState("");
  const [seenIndexes, setSeenIndexes] = useState([]);
  const [values, setValues] = useState({});

  // Fetch data on mount
  useEffect(() => {
    const fetchValues = async () => {
      const valuesRes = await axios.get("/api/values/current");
      setValues(valuesRes.data);
    };

    const fetchIndexes = async () => {
      const indexesRes = await axios.get("/api/values/all");
      setSeenIndexes(indexesRes.data);
    };

    fetchValues();
    fetchIndexes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios.post("/api/values", {
      index: index,
    });

    setIndex("");
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Enter your index:</label>
        <input value={index} onChange={(e) => setIndex(e.target.value)} />
        <button type="submit">Submit</button>
      </form>

      <h3>Indexes I have seen:</h3>
      <ul>
        {seenIndexes.map((entry, i) => (
          <li key={i}>{entry.number}</li>
        ))}
      </ul>

      <h3>Calculated values:</h3>
      <ul>
        {Object.entries(values).map(([key, value]) => (
          <li key={key}>
            {key}: {value}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Fib;
