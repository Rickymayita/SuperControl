import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { differenceInMinutes, format } from "date-fns";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function HistorialScreen() {
  const [registros, setRegistros] = useState([]);

  // 1. Cargar datos cada vez que la pestaña toma el foco
  useFocusEffect(
    useCallback(() => {
      const cargarHistorial = async () => {
        const data = await AsyncStorage.getItem("@historial_turnos");
        if (data) setRegistros(JSON.parse(data));
      };
      cargarHistorial();
    }, []),
  );

  // --- LÓGICA DE CÁLCULOS GLOBALES ---
  const totalCaja = registros.reduce((acc, curr) => acc + curr.balance, 0);

  const totalMinutosExtra = registros.reduce((acc, item) => {
    const minutosTrabajados = differenceInMinutes(
      new Date(item.salida),
      new Date(item.entrada),
    );
    const extra = minutosTrabajados - 480; // 8 horas base
    return extra > 0 ? acc + extra : acc;
  }, 0);

  const horasTotalesExtra = Math.floor(totalMinutosExtra / 60);
  const minutosRestantesExtra = totalMinutosExtra % 60;

  // --- FUNCIONES DE APOYO ---
  const calcularExtrasIndividuales = (entrada, salida) => {
    const minutos = differenceInMinutes(new Date(salida), new Date(entrada));
    const extra = minutos - 480;
    if (extra <= 0) return null;
    const h = Math.floor(extra / 60);
    const m = extra % 60;
    return `${h}h ${m}m extra`;
  };

  const renderItem = ({ item }) => {
    const extrasIndividuales = calcularExtrasIndividuales(
      item.entrada,
      item.salida,
    );
    const esSobrante = item.balance > 0;
    const esFaltante = item.balance < 0;
    const balanceTexto = esSobrante
      ? "Sobrante"
      : esFaltante
        ? "Faltante"
        : "Exacto";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.fechaText}>{item.fecha}</Text>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>{balanceTexto}</Text>
            <Text
              style={[
                styles.balanceText,
                {
                  color: esFaltante
                    ? "#FF3B30"
                    : esSobrante
                      ? "#34C759"
                      : "#8E8E93",
                },
              ]}
            >
              $ {Math.abs(item.balance).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.horaText}>
            {format(new Date(item.entrada), "HH:mm")} -{" "}
            {format(new Date(item.salida), "HH:mm")}
          </Text>
          {extrasIndividuales && (
            <Text style={styles.extraBadge}>{extrasIndividuales}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Turnos</Text>

      {/* TABLERO DE RESUMEN GLOBAL */}
      <View style={styles.resumenGlobal}>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenLabel}>Balance Total</Text>
          <Text
            style={[
              styles.resumenValor,
              { color: totalCaja < 0 ? "#FF3B30" : "#34C759" },
            ]}
          >
            $ {totalCaja.toFixed(2)}
          </Text>
        </View>

        <View style={styles.divisorVertical} />

        <View style={styles.resumenItem}>
          <Text style={styles.resumenLabel}>Total Extras</Text>
          <Text style={[styles.resumenValor, { color: "#5856D6" }]}>
            {horasTotalesExtra}h {minutosRestantesExtra}m
          </Text>
        </View>
      </View>

      <FlatList
        data={registros}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no hay registros guardados.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  resumenGlobal: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 25,
  },
  resumenItem: { alignItems: "center", flex: 1 },
  resumenLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#8E8E93",
    fontWeight: "700",
    marginBottom: 5,
  },
  resumenValor: { fontSize: 20, fontWeight: "bold" },
  divisorVertical: { width: 1, height: "60%", backgroundColor: "#eee" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fechaText: { fontSize: 16, fontWeight: "600", color: "#444" },
  balanceContainer: { alignItems: "flex-end" },
  balanceLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#999",
    fontWeight: "700",
  },
  balanceText: { fontSize: 18, fontWeight: "bold" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  horaText: { fontSize: 14, color: "#666" },
  extraBadge: {
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
    color: "#007AFF",
  },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
