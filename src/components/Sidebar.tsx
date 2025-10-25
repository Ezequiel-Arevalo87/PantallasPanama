import React, { useMemo, useState } from 'react';
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
import { ExpandLess, ExpandMore, ChevronRight } from '@mui/icons-material';
import { Asignacion } from '../pages/Asignacion';

export type SidebarProps = {
  onSelect: (path: string) => void;  // e.g. "PROCESOS DE AUDITORIAS/GESTIÓN DE AUDITORIA/XXXXX"
  selected?: string;
};

/** ----- Estilos ----- */
const SECTION_STYLE = {
  borderRadius: 12,
  px: 1,
  py: 0.5,
  '&:hover': { bgcolor: 'action.hover' },
} as const;

const ITEM_STYLE = {
  borderRadius: 8,
  mx: 1,
  my: 0.25,
  '& .MuiListItemText-primary': { fontSize: 14 },
  '&.Mui-selected': {
    bgcolor: 'action.selected',
    position: 'relative' as const,
    '&:before': {
      content: '""',
      position: 'absolute' as const,
      left: 0,
      top: 6,
      bottom: 6,
      width: 3,
      bgcolor: 'primary.main',
      borderRadius: 2,
    },
  },
  '&.Mui-selected:hover': { bgcolor: 'action.selected' },
} as const;

/** ----- Tipos del árbol ----- */
type MenuNode = {
  label: string;
  children?: MenuNode[];
};

/** Util para crear paths únicos por nivel */
const buildPath = (parent: string, label: string) =>
  parent ? `${parent}/${label}` : label;

/** Datos del menú (con submenús anidados) */
const useMenuData = () => {

  const home: MenuNode[] = [{ label: "HOME" }];
  const trazabilidad: MenuNode[] = [{ label: 'TRAZABILIDAD' }];
  const selectorCaso: MenuNode[] = [
    { label: 'SELECTOR DE CASOS Y PRIORIZACIÓN' },
  ];
  const priorizacion: MenuNode[] = [
    { label: 'VERIFICACIÓN' },
  ];
  const aprobacion: MenuNode[] = [
    { label: 'APROBACIÓN' },
  ];
  const asignacion: MenuNode[] = [
    { label: 'ASIGNACIÓN' },
  ];

  // const analisis: MenuNode[] = [
  //   { label: 'HISTORIAL CUMPLIMIENTO' },
  //   { label: 'ANALISIS FISCAL' },
  // ];

  // const fiscalizacion: MenuNode[] = [
  //   { label: 'VARIACIÓN EN INGRESOS' },
  //   { label: 'ASIGNACIÓN' },
  // ];

  const auditorias: MenuNode[] = [
    {label : 'CONSULTAS DE ESTADOS'},
    { label: 'INICIO DE AUDITORIA' },
    {
      label: 'GESTIÓN DE AUDITORIA',
      children: [
        { label: 'AUDITOR' },
        { label: 'SUPERVISOR' },
        { label: 'DIRECTOR' },
      ],
    },
    { label: 'REVISIÓN AUDITOR' },
    { label: 'VARIACIÓN EN INGRESOS' },
    { label: 'HISTORIAL CUMPLIMIENTO' },
    { label: 'ANALISIS FISCAL' },
    // { label: 'PRIORIZACIÓN' },
    
    { label: 'REVISIÓN SUPERVISOR' },
    { label: 'REVISIÓN JEFE DE SECCIÓN' },
    { label: 'PRESENTACIÓN VOLUNTARIA' },
    { label: 'LIQUIDACIONES ADICIONALES' },
    { label: 'ELIMINACIONES' },
    { label: 'RECTIFICATIVA' },
    { label: 'CIERRE' },
  ];

  const modulos: MenuNode[] = [
    { label: 'MÓDULO COMUNICACIÓN' },
    { label: 'MÓDULO CONSULTAS' },
    { label: 'MÓDULO ALERTAS' },
  ];

  return { home, trazabilidad, auditorias, modulos, selectorCaso, priorizacion, aprobacion, asignacion };
};

export const Sidebar: React.FC<SidebarProps> = ({ onSelect, selected }) => {

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const { home, trazabilidad, auditorias, modulos, selectorCaso, priorizacion, aprobacion,  asignacion } = useMenuData();


  const ROOTS = useMemo(() => ['SELECTOR DE CASOS Y PRIORIZACIÓN', 'PROCESOS DE AUDITORIAS'] as const, []);
  const toggleRoot = (root: typeof ROOTS[number]) => {
    setOpenMap((prev) => {
      const next: Record<string, boolean> = { ...prev };
      ROOTS.forEach((r) => {
        next[r] = r === root ? !prev[r] : false;
      });
      return next;
    });
  };

  /** Toggle genérico para cualquier nodo con children (por path) */
  const togglePath = (path: string) => setOpenMap((prev) => ({ ...prev, [path]: !prev[path] }));

  /** Render recursivo de nodos */
  const renderNodes = (nodes: MenuNode[], parentPath: string) => (
    <List dense disablePadding sx={{ pl: parentPath ? 1 : 0 }}>
      {nodes.map((node) => {
        const thisPath = buildPath(parentPath, node.label);
        const hasChildren = !!node.children?.length;
        const isOpen = !!openMap[thisPath];

        if (hasChildren) {
          return (
            <React.Fragment key={thisPath}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => togglePath(thisPath)} sx={ITEM_STYLE}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary={node.label} />
                </ListItemButton>
              </ListItem>
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                {renderNodes(node.children!, thisPath)}
              </Collapse>
            </React.Fragment>
          );
        }

        // Hoja (item clickeable)
        return (
          <ListItem key={thisPath} disablePadding>
            <ListItemButton onClick={() => onSelect(thisPath)} selected={selected === thisPath} sx={ITEM_STYLE}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <ChevronRight fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={node.label} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ width: 280, p: 1.5, pt: 0.5, color: 'text.primary', height: '100%', overflowY: 'auto', minHeight: 0 }}>
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

         {/* HOME primero */}
        {home.map((h) => {
          const path = h.label;
          return (
            <ListItemButton key={path} sx={{ ...SECTION_STYLE, py: 1 }} onClick={() => onSelect(path)} selected={selected === path}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                {h.label}
              </Typography>
            </ListItemButton>
          );
        })}

        <Divider sx={{ my: 1.5 }} />
        {/* NUEVO: Trazabilidad simple */}
{trazabilidad.map((t) => {
  const path = t.label;
  return (
    <ListItemButton key={path} sx={{ ...SECTION_STYLE, py: 1 }} onClick={() => onSelect(path)} selected={selected === path}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
        {t.label}
      </Typography>
    </ListItemButton>
  );
})}

<Divider sx={{ my: 1.5 }} />
        {/* Selector de Casos simple al tope */}

        {selectorCaso.map((s) => {
          const path = s.label;
          return (
            <ListItemButton key={path} sx={{ ...SECTION_STYLE, py: 1 }} onClick={() => onSelect(path)} selected={selected === path}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                {s.label}
              </Typography>
            </ListItemButton>
          );
        })}

        <Divider sx={{ my: 1.5 }} />

        {priorizacion.map((p) => {
          const path = p.label;
          return (
            <ListItemButton key={path} sx={{ ...SECTION_STYLE, py: 1 }} onClick={() => onSelect(path)} selected={selected === path}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                {p.label}
              </Typography>
            </ListItemButton>
          );
        })}
        
        <Divider sx={{ my: 1.5 }} />
        {aprobacion.map((a) => {
          const path = a.label;
          return (
            <ListItemButton key={path} sx={{ ...SECTION_STYLE, py: 1 }} onClick={() => onSelect(path)} selected={selected === path}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                {a.label}
              </Typography>
            </ListItemButton>
          );
        })}


        <Divider sx={{ my: 1.5 }} />

        {asignacion.map((a) => {
          const path = a.label;
          return (
            <ListItemButton key={path} sx={{ ...SECTION_STYLE, py: 1 }} onClick={() => onSelect(path)} selected={selected === path}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                {a.label}
              </Typography>
            </ListItemButton>
          );
        })}

        <Divider sx={{ my: 1.5 }} />

        {/* SELECCIONES DE CASOS (root)
        <ListItemButton onClick={() => toggleRoot('SELECCIONES DE CASOS')} sx={SECTION_STYLE} selected={!!openMap['SELECCIONES DE CASOS']}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1, letterSpacing: 0.3, color: 'text.secondary' }}>
            SELECCIONES DE CASOS
          </Typography>
          {openMap['SELECCIONES DE CASOS'] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </ListItemButton>
        <Collapse in={!!openMap['SELECCIONES DE CASOS']} timeout="auto" unmountOnExit>
          {renderNodes(analisis, 'SELECCIONES DE CASOS')}
        </Collapse>

        <Divider sx={{ my: 1.5 }} /> */}

        {/* FISCALIZACIÓN (root)
        <ListItemButton onClick={() => toggleRoot('FISCALIZACIÓN')} sx={SECTION_STYLE} selected={!!openMap['FISCALIZACIÓN']}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1, letterSpacing: 0.3, color: 'text.secondary' }}>
            FISCALIZACIÓN
          </Typography>
          {openMap['FISCALIZACIÓN'] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </ListItemButton>
        <Collapse in={!!openMap['FISCALIZACIÓN']} timeout="auto" unmountOnExit>
          {renderNodes(fiscalizacion, 'FISCALIZACIÓN')}
        </Collapse>

        <Divider sx={{ my: 1.5 }} /> */}

        {/* PROCESOS DE AUDITORIAS (root) */}
        <ListItemButton onClick={() => toggleRoot('PROCESOS DE AUDITORIAS')} sx={SECTION_STYLE} selected={!!openMap['PROCESOS DE AUDITORIAS']}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1, letterSpacing: 0.3, color: 'text.secondary' }}>
            PROCESOS DE AUDITORIAS
          </Typography>
          {openMap['PROCESOS DE AUDITORIAS'] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </ListItemButton>
        <Collapse in={!!openMap['PROCESOS DE AUDITORIAS']} timeout="auto" unmountOnExit>
          {renderNodes(auditorias, 'PROCESOS DE AUDITORIAS')}
        </Collapse>

        <Divider sx={{ my: 1.5 }} />

        {/* Módulos simples */}
        {modulos.map((m) => {
          const path = m.label;
          return (
            <ListItemButton key={path} sx={{ ...SECTION_STYLE, py: 1 }} onClick={() => onSelect(path)} selected={selected === path}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                {m.label}
              </Typography>
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};