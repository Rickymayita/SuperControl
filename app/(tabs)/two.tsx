import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function HistorialScreen() {
  const [registros, setRegistros] = useState([]);

  // Se ejecuta cada vez que entrás a esta pestaña
  useFocusEffect(
    useCallback(() => {
      const cargarHistorial = async () => {
        const data = await AsyncStorage.getItem("@historial_turnos");
        if (data) setRegistros(JSON.parse(data));
      };
      cargarHistorial();
    }, []),
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.fechaText}>{item.fecha}</Text>
        <Text
          style={[
            styles.balanceText,
            { color: item.balance < 0 ? "#FF3B30" : "#34C759" },
          ]}
        >
          {item.balance >= 0 ? "+" : ""}
          {item.balance.toFixed(2)}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.horaText}>
          {format(new Date(item.entrada), "HH:mm")} —{" "}
          {format(new Date(item.salida), "HH:mm")}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Turnos</Text>
      <FlatList
        data={registros}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay turnos registrados aún.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fechaText: { fontSize: 16, fontWeight: "600", color: "#555" },
  balanceText: { fontSize: 18, fontWeight: "bold" },
  cardFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  horaText: { fontSize: 14, color: "#888" },
  empty: { textAlign: "center", marginTop: 50, color: "#999", fontSize: 16 },
});
