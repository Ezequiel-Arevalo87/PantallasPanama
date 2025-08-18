import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Divider,
  Collapse,
  Typography,
  ListItemIcon,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material';

type Props = {
  onSelect: (op: string) => void;
  selected?: string;
};

const SECTION_STYLE = {
  borderRadius: 1.5,
  px: 1,
  py: 0.5,
  '&:hover': { bgcolor: 'action.hover' },
};

const ITEM_STYLE = {
  borderRadius: 1,
  mx: 1,
  my: 0.25,
  '& .MuiListItemText-primary': { fontSize: 14 },
  '&.Mui-selected': {
    bgcolor: 'action.selected',
    '&:before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 6,
      bottom: 6,
      width: 3,
      bgcolor: 'primary.main',
      borderRadius: 2,
    },
  },
  '&.Mui-selected:hover': { bgcolor: 'action.selected' },
};

export const Sidebar: React.FC<Props> = ({ onSelect, selected }) => {
  // acordeón: solo una sección abierta a la vez
  const [open, setOpen] = useState<{ [k: string]: boolean }>({
    FISCALIZACIÓN: false,
    'PROCESOS DE AUDITORIAS': false,
  });

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next: any = {};
      Object.keys(prev).forEach((k) => (next[k] = k === key ? !prev[k] : false));
      return next;
    });

  const fiscalizacion = [
    'VARIACIÓN EN INGRESOS',
    'SELECCIÓN DE CASOS',
    'PRIORIZACIÓN',
    'ASIGNACIÓN',
  ];

  const auditorias = [
    'INICIO DE AUDITORIA',
    'GESTIÓN DE AUDITORIA',
    'REVISIÓN AUDITOR',
    'REVISIÓN SUPERVISOR',
    'REVISIÓN JEFE DE SECCIÓN',
    'PRESENTACIÓN VOLUNTARIA',
    'LIQUIDACIONES ADICIONALES',
    'ELIMINACIONES',
    'RECTIFICATIVA',
    'CIERRE',
  ];

  const SectionHeader = ({
    label,
    isOpen,
    onClick,
  }: {
    label: string;
    isOpen: boolean;
    onClick: () => void;
  }) => (
    <ListItemButton onClick={onClick} sx={SECTION_STYLE}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, flexGrow: 1, letterSpacing: 0.3, color: 'text.secondary' }}
      >
        {label}
      </Typography>
      {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
    </ListItemButton>
  );

  const renderItems = (items: string[]) => (
    <List dense disablePadding sx={{ pl: 1 }}>
      {items.map((op) => (
        <ListItem key={op} disablePadding>
          <ListItemButton
            onClick={() => onSelect(op)}
            selected={selected === op}
            sx={ITEM_STYLE}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <ChevronRight fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={op} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box
      sx={{
        width: 280,
        p: 1.5,
        pt: 0.5,
        color: 'text.primary',
      }}
    >
      <List
        subheader={
          <ListSubheader
            component="div"
            disableSticky
            sx={{ bgcolor: 'transparent', px: 0, py: 1, fontWeight: 800, fontSize: 12, color: 'text.disabled' }}
          >
            MENÚ PRINCIPAL
          </ListSubheader>
        }
      >
        {/* FISCALIZACIÓN */}
        <SectionHeader
          label="FISCALIZACIÓN"
          isOpen={open['FISCALIZACIÓN']}
          onClick={() => toggle('FISCALIZACIÓN')}
        />
        <Collapse in={open['FISCALIZACIÓN']} timeout="auto" unmountOnExit>
          {renderItems(fiscalizacion)}
        </Collapse>

        <Divider sx={{ my: 1.5 }} />

        {/* PROCESOS DE AUDITORIAS */}
        <SectionHeader
          label="PROCESOS DE AUDITORIAS"
          isOpen={open['PROCESOS DE AUDITORIAS']}
          onClick={() => toggle('PROCESOS DE AUDITORIAS')}
        />
        <Collapse in={open['PROCESOS DE AUDITORIAS']} timeout="auto" unmountOnExit>
          {renderItems(auditorias)}
        </Collapse>

        <Divider sx={{ my: 1.5 }} />

        {/* Módulos simples (no colapsables) */}
        {[
          'MÓDULO COMUNICACIÓN',
          'MÓDULO CONSULTAS',
          'MÓDULO ALERTAS',
        ].map((t) => (
          <ListItemButton key={t} sx={{ ...SECTION_STYLE, py: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
              {t}
            </Typography>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};
