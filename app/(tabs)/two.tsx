import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { differenceInMinutes, format } from "date-fns";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HistorialScreen() {
  const [registros, setRegistros] = useState([]);

  // Estados para la edición
  const [modalVisible, setModalVisible] = useState(false);
  const [registroAEditar, setRegistroAEditar] = useState(null);
  const [nuevoBalance, setNuevoBalance] = useState("");
  const [horaEntrada, setHoraEntrada] = useState("");
  const [horaSalida, setHoraSalida] = useState("");

  useFocusEffect(
    useCallback(() => {
      const cargarHistorial = async () => {
        const data = await AsyncStorage.getItem("@historial_turnos");
        if (data) setRegistros(JSON.parse(data));
      };
      cargarHistorial();
    }, []),
  );

  // --- LÓGICA DE CÁLCULOS ---
  const totalCaja = registros.reduce((acc, curr) => acc + curr.balance, 0);
  const totalMinutosExtra = registros.reduce((acc, item) => {
    const minutos = differenceInMinutes(
      new Date(item.salida),
      new Date(item.entrada),
    );
    const extra = minutos - 480;
    return extra > 0 ? acc + extra : acc;
  }, 0);

  const horasTotalesExtra = Math.floor(totalMinutosExtra / 60);
  const minutosRestantesExtra = totalMinutosExtra % 60;

  // --- FUNCIONES DE ACCIÓN ---
  const borrarRegistro = (id) => {
    Alert.alert("Borrar", "¿Eliminar este turno?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          const nuevaLista = registros.filter((item) => item.id !== id);
          setRegistros(nuevaLista);
          await AsyncStorage.setItem(
            "@historial_turnos",
            JSON.stringify(nuevaLista),
          );
        },
      },
    ]);
  };

  const abrirEditor = (item) => {
    setRegistroAEditar(item);
    setNuevoBalance(item.balance.toString());
    setHoraEntrada(format(new Date(item.entrada), "HH:mm"));
    setHoraSalida(format(new Date(item.salida), "HH:mm"));
    setModalVisible(true);
  };

  const guardarEdicion = async () => {
    const nuevaLista = registros.map((item) => {
      if (item.id === registroAEditar.id) {
        // Función para mezclar fecha vieja con hora nueva
        const actualizarFecha = (fechaOriginal, nuevaHoraPrev) => {
          const [horas, minutos] = nuevaHoraPrev.split(":");
          const d = new Date(fechaOriginal);
          d.setHours(parseInt(horas), parseInt(minutos));
          return d.toISOString();
        };

        return {
          ...item,
          balance: parseFloat(nuevoBalance) || 0,
          entrada: actualizarFecha(item.entrada, horaEntrada),
          salida: actualizarFecha(item.salida, horaSalida),
        };
      }
      return item;
    });

    setRegistros(nuevaLista);
    await AsyncStorage.setItem("@historial_turnos", JSON.stringify(nuevaLista));
    setModalVisible(false);
  };

  const renderItem = ({ item }) => {
    const esFaltante = item.balance < 0;
    const minutosTurno = differenceInMinutes(
      new Date(item.salida),
      new Date(item.entrada),
    );
    const extraActual = minutosTurno - 480; // 480 min = 8 horas
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.fechaText}>{item.fecha}</Text>
          </View>
          <View>
            {extraActual > 0 && (
              <Text style={styles.extraBadgeText}>
                +{Math.floor(extraActual / 60)}h {extraActual % 60}m extra
              </Text>
            )}
          </View>
          <View style={styles.balanceContainer}>
            <Text
              style={[
                styles.balanceText,
                { color: esFaltante ? "#FF3B30" : "#34C759" },
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
          <View style={styles.accionesContainer}>
            <TouchableOpacity
              onPress={() => abrirEditor(item)}
              style={styles.btnAccion}
            >
              <Text style={styles.btnEditText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => borrarRegistro(item.id)}
              style={styles.btnAccion}
            >
              <Text style={styles.btnBorrarText}>Borrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Turnos</Text>

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
      />

      {/* --- MODAL DE EDICIÓN --- */}
      {/* --- MODAL DE EDICIÓN --- */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", alignItems: "center" }}
          >
            {/* El contenido VA ADENTRO del KeyboardAvoidingView */}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Registro</Text>

              <Text style={styles.inputLabel}>Balance de Caja</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={nuevoBalance}
                onChangeText={setNuevoBalance}
                placeholderTextColor={"#999"}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Entrada (HH:mm)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={horaEntrada}
                    onChangeText={setHoraEntrada}
                    placeholder="08:00"
                    placeholderTextColor={"#999"}
                  />
                </View>
                <View style={{ width: 20 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Salida (HH:mm)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={horaSalida}
                    onChangeText={setHoraSalida}
                    placeholder="16:00"
                    placeholderTextColor={"#999"}
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.btnModal, styles.btnCancel]}
                >
                  <Text style={styles.textCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={guardarEdicion}
                  style={[styles.btnModal, styles.btnSave]}
                >
                  <Text style={styles.textSave}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  resumenGlobal: {
    backgroundColor: "#fff",
    flexDirection: "row",
    paddingVertical: 20,
    borderRadius: 15,
    elevation: 4,
    marginBottom: 25,
  },
  resumenItem: { alignItems: "center", flex: 1 },
  resumenLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#8E8E93",
    fontWeight: "700",
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
  extraBadgeText: { fontSize: 16, fontWeight: "600" },
  fechaText: { fontSize: 16, fontWeight: "600" },
  balanceContainer: { alignItems: "flex-end" },
  balanceText: { fontSize: 18, fontWeight: "bold" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  horaText: { fontSize: 14, color: "#666" },
  accionesContainer: { flexDirection: "row", gap: 10 },
  btnAccion: { padding: 6, backgroundColor: "#f9f9f9", borderRadius: 8 },
  btnEditText: { color: "#007AFF", fontWeight: "600" },
  btnBorrarText: { color: "#FF3B30", fontWeight: "600" },

  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    maxHeight: "90%", // Un poco más de margen para scroll
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20, // Más espacio para que no choque con el primer label
    color: "#333",
  },
  inputLabel: {
    // ESTILO NUEVO: Para los títulos chiquitos arriba de cada input
    fontSize: 11,
    textTransform: "uppercase",
    color: "#8E8E93",
    fontWeight: "700",
    marginBottom: 5,
  },
  modalInput: {
    borderBottomWidth: 2,
    borderColor: "#007AFF",
    fontSize: 18, // Bajamos de 22 a 18 para que no sea tan "pesado" visualmente
    padding: 10,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
    backgroundColor: "#f9f9f9", // Un fondo leve para que se note el área de contacto
    borderRadius: 8,
  },
  row: {
    // ESTILO NUEVO: Para alinear Entrada y Salida
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
    gap: 10,
  },
  btnModal: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  btnCancel: {
    marginRight: 10,
    backgroundColor: "#f5f5f5",
  },
  btnSave: {
    backgroundColor: "#007AFF",
  },
  textCancel: { color: "#666", fontWeight: "bold" },
  textSave: { color: "#fff", fontWeight: "bold" },

  // Reutilizamos el estilo del balance que ya tenías
  balanceText: { fontSize: 18, fontWeight: "bold" },
});
