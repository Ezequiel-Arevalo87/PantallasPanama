// src/components/DetalleConTrazabilidad.tsx
import * as React from "react";
import {
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Trazabilidad, { type TrazaItem } from "./Trazabilidad";

type Props = {
  open: boolean;
  onClose: () => void;

  /** Contenido libre del detalle (JSX o string) */
  detalle: React.ReactNode;

  /** Filas de trazabilidad */
  trazas: TrazaItem[];

  /** Título del diálogo */
  titulo?: string;

  /** Altura de la tabla de trazabilidad (opcional) */
  trazaHeight?: number | string;
};

function a11yProps(index: number) {
  return { id: `detalle-tab-${index}`, "aria-controls": `detalle-tabpanel-${index}` };
}

const DetalleConTrazabilidad: React.FC<Props> = ({
  open,
  onClose,
  detalle,
  trazas,
  titulo = "Detalle",
  trazaHeight = 420,
}) => {
  const [tab, setTab] = React.useState(0);
  const handleChange = (_: React.SyntheticEvent, newValue: number) => setTab(newValue);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {titulo}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs value={tab} onChange={handleChange} aria-label="tabs detalle">
          <Tab label="Información" {...a11yProps(0)} />
          <Tab label="Trazabilidad" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ pt: 2 }}>
        {/* Información */}
        <Box
          role="tabpanel"
          hidden={tab !== 0}
          id="detalle-tabpanel-0"
          aria-labelledby="detalle-tab-0"
        >
          {tab === 0 && <Box sx={{ mt: 1 }}>{detalle}</Box>}
        </Box>

        {/* Trazabilidad */}
        <Box
          role="tabpanel"
          hidden={tab !== 1}
          id="detalle-tabpanel-1"
          aria-labelledby="detalle-tab-1"
        >
          {tab === 1 && (
            <Box sx={{ mt: 1 }}>
              <Trazabilidad rows={trazas} height={trazaHeight} />
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DetalleConTrazabilidad;
