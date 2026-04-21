import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function HomeScreen() {
  const [isWorking, setIsWorking] = useState(false);
  const [entrada, setEntrada] = useState<string | null>(null);
  const [cajaBalance, setCajaBalance] = useState("");

  // 1. Cargar estado al abrir la app
  useEffect(() => {
    const loadState = async () => {
      const savedEntrada = await AsyncStorage.getItem("@entrada_actual");
      if (savedEntrada) {
        setEntrada(savedEntrada);
        setIsWorking(true);
      }
    };
    loadState();
  }, []);

  const handleToggleTurno = async () => {
    if (!isWorking) {
      // INICIAR TURNO (Igual que antes)
      const ahora = new Date().toISOString();
      await AsyncStorage.setItem("@entrada_actual", ahora);
      setEntrada(ahora);
      setIsWorking(true);
    } else {
      // FINALIZAR TURNO
      if (!cajaBalance) {
        Alert.alert("Atención", "Por favor, ingresá el balance de caja.");
        return;
      }

      const salida = new Date().toISOString();
      const nuevoRegistro = {
        id: Date.now().toString(), // Un ID único para cada registro
        entrada,
        salida,
        balance: parseFloat(cajaBalance),
        fecha: format(new Date(), "dd/MM/yyyy"),
      };

      try {
        // 1. Traemos lo que ya estaba guardado
        const historialPrevio = await AsyncStorage.getItem("@historial_turnos");
        const historialCargado = historialPrevio
          ? JSON.parse(historialPrevio)
          : [];

        // 2. Agregamos el nuevo y guardamos la lista completa
        const nuevoHistorial = [nuevoRegistro, ...historialCargado];
        await AsyncStorage.setItem(
          "@historial_turnos",
          JSON.stringify(nuevoHistorial),
        );

        // 3. Limpiamos el estado actual
        await AsyncStorage.removeItem("@entrada_actual");
        setIsWorking(false);
        setEntrada(null);
        setCajaBalance("");
        Alert.alert("¡Hecho!", "Turno y balance guardados.");
      } catch (error) {
        Alert.alert("Error", "No se pudo guardar el registro.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>SúperControl 🛒</Text>

            {entrada && (
              <Text style={styles.status}>
                Entraste a las: {format(new Date(entrada), "HH:mm")}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                isWorking ? styles.buttonStop : styles.buttonStart,
              ]}
              onPress={handleToggleTurno}
            >
              <Text style={styles.buttonText}>
                {isWorking ? "Cerrar Caja y Salir" : "Iniciar Jornada"}
              </Text>
            </TouchableOpacity>

            {isWorking && (
              <TextInput
                style={styles.input}
                placeholder="Balance de caja (ej: -15.00)"
                keyboardType="numeric"
                value={cajaBalance}
                onChangeText={setCajaBalance}
                autoFocus={true} // Abre el teclado automáticamente
              />
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "#f5f5f5",
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, color: "#333" },
  status: { fontSize: 16, marginBottom: 30, color: "#666" },
  button: {
    padding: 20,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    elevation: 3,
  },
  buttonStart: { backgroundColor: "#007AFF" },
  buttonStop: { backgroundColor: "#FF3B30" },
  buttonText: { color: "white", fontSize: 20, fontWeight: "bold" },
  input: {
    borderBottomWidth: 2,
    borderColor: "#007AFF",
    width: "100%",
    marginTop: 30,
    padding: 15,
    fontSize: 18,
    backgroundColor: "white",
    borderRadius: 10,
  },
});
