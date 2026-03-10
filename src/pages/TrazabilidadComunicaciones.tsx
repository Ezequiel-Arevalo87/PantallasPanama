import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  readTrazabilidadComunicaciones,
  type TrazabilidadCorreo,
} from "../lib/trazabilidadComunicacionesStorage";

const getEstadoColor = (estado: TrazabilidadCorreo["estado"]) => {
  switch (estado) {
    case "RESPONDIDO":
      return "success";
    case "VENCIDO":
      return "error";
    default:
      return "info";
  }
};

const TrazabilidadComunicaciones: React.FC = () => {
  const [ruc, setRuc] = React.useState("");
  const [tramite, setTramite] = React.useState("");
  const [rows, setRows] = React.useState<TrazabilidadCorreo[]>([]);
  const [error, setError] = React.useState("");

  const loadData = React.useCallback(() => {
    const all = readTrazabilidadComunicaciones();
    setRows(all);
  }, []);

  React.useEffect(() => {
    loadData();

    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  const handleBuscar = () => {
    setError("");

    const all = readTrazabilidadComunicaciones();

    const r = ruc.trim().toLowerCase();
    const t = tramite.trim().toLowerCase();

    const filtered = all.filter((item) => {
      const matchRuc = !r || item.ruc.toLowerCase().includes(r);
      const matchTramite = !t || item.noTramite.toLowerCase().includes(t);
      return matchRuc && matchTramite;
    });

    if (!filtered.length) {
      setRows([]);
      setError("No se encontraron registros para los filtros ingresados.");
      return;
    }

    setRows(filtered);
  };

  const handleLimpiar = () => {
    setRuc("");
    setTramite("");
    setError("");
    setRows(readTrazabilidadComunicaciones());
  };

  return (
    <Box component={Paper} sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        Trazabilidad de Comunicaciones
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{
          mb: 2,
          "& .MuiTextField-root": { flex: 1 },
          "& .MuiButton-root": { minWidth: 120, height: 56, fontWeight: 700 },
        }}
      >
        <TextField
          label="RUC"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          placeholder="Ej.: 8-359-1371"
        />
        <TextField
          label="No. Trámite"
          value={tramite}
          onChange={(e) => setTramite(e.target.value)}
          placeholder="Ej.: TRM-2026-000008"
        />
        <Button variant="contained" onClick={handleBuscar}>
          Buscar
        </Button>
        <Button variant="outlined" color="inherit" onClick={handleLimpiar}>
          Limpiar
        </Button>
      </Stack>

      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <TableContainer
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          maxHeight: 470,
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: 1600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, minWidth: 120 }}>RUC</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>No Trámite</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 170 }}>Fecha Envío</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 170 }}>Fecha Respuesta</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 110 }}>Origen</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Destino</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 240 }}>Asunto</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 320 }}>Mensaje</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>No Documento</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Nombre Documento</TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 110, textAlign: "center" }}>
                Días Falt.
              </TableCell>
              <TableCell sx={{ fontWeight: 800, minWidth: 130, textAlign: "center" }}>
                Estado
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.ruc}</TableCell>
                <TableCell>{item.noTramite}</TableCell>
                <TableCell>{item.fechaEnvio}</TableCell>
                <TableCell>{item.fechaRespuesta}</TableCell>
                <TableCell>{item.origen}</TableCell>
                <TableCell>{item.destino}</TableCell>
                <TableCell>{item.asunto}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "normal", lineHeight: 1.4 }}
                  >
                    {item.mensaje}
                  </Typography>
                </TableCell>
                <TableCell>{item.noDocumento}</TableCell>
                <TableCell>{item.nombreDocumento}</TableCell>
                <TableCell align="center">{item.diasFaltantes}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={item.estado}
                    color={getEstadoColor(item.estado) as any}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TrazabilidadComunicaciones;