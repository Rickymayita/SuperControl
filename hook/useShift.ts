import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export const useShift = () => {
  const [history, setHistory] = useState([]);

  // Cargar datos al iniciar
  useEffect(() => {
    const loadData = async () => {
      const stored = await AsyncStorage.getItem("@mis_turnos");
      if (stored) setHistory(JSON.parse(stored));
    };
    loadData();
  }, []);

  // Función para guardar un nuevo día
  const saveDay = async (newDay) => {
    const updatedHistory = [...history, newDay];
    setHistory(updatedHistory);
    await AsyncStorage.setItem("@mis_turnos", JSON.stringify(updatedHistory));
  };

  return { history, saveDay };
};
