// src/pages/TablaResultadosComunicacion.tsx
import * as React from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

export type CasoInfo = {
  noTramite: string;
  ruc: string;
  razonSocial: string;
  actaInicio: string;
  representanteLegal: string;
  correo: string;
};

type Props = {
  rows: CasoInfo[];
  onSelect: (row: CasoInfo) => void;
  height?: number;
};

const TablaResultadosComunicacion: React.FC<Props> = ({ rows, onSelect, height = 420 }) => {
  const columns = React.useMemo<GridColDef<CasoInfo>[]>(
    () => [
      {
        field: "noTramite",
        headerName: "Trámite",
        minWidth: 150,
        flex: 0.6,
        renderCell: (p) => <Typography fontWeight={800}>{p.value}</Typography>,
      },
      { field: "ruc", headerName: "RUC", minWidth: 140, flex: 0.45 },
      { field: "razonSocial", headerName: "Razón Social", minWidth: 240, flex: 1.2 },
      { field: "representanteLegal", headerName: "Representante Legal", minWidth: 200, flex: 0.9 },
      { field: "correo", headerName: "Correo", minWidth: 200, flex: 0.9 },
      {
        field: "actaInicio",
        headerName: "Acta Inicio",
        minWidth: 160,
        flex: 0.55,
        renderCell: (p) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      {
        field: "__acciones__",
        headerName: "Acciones",
        minWidth: 160,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Button variant="contained" size="small" onClick={() => onSelect(p.row)}>
            Gestionar
          </Button>
        ),
      },
    ],
    [onSelect]
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 900 }}>Resultados</Typography>
        <Chip size="small" label={`${rows.length}`} />
      </Stack>

      <Box sx={{ height, width: "100%" }}>
        <DataGrid
          rows={rows.map((r) => ({ ...r, id: `${r.ruc}|${r.noTramite}` }))}
          columns={columns as any}
          disableRowSelectionOnClick
          density="compact"
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default TablaResultadosComunicacion;
