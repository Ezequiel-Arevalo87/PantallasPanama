import React, { useMemo, useState } from "react";
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
} from "@mui/material";

import { ExpandLess, ExpandMore, ChevronRight } from "@mui/icons-material";

export type SidebarProps = {
  onSelect: (path: string) => void;
  selected?: string;
};

const SECTION_STYLE = {
  borderRadius: 12,
  px: 1,
  py: 0.5,
  "&:hover": { bgcolor: "action.hover" },
} as const;

const ITEM_STYLE = {
  borderRadius: 8,
  mx: 1,
  my: 0.25,
  "& .MuiListItemText-primary": { fontSize: 14 },
  "&.Mui-selected": {
    bgcolor: "action.selected",
    position: "relative" as const,
    "&:before": {
      content: '""',
      position: "absolute" as const,
      left: 0,
      top: 6,
      bottom: 6,
      width: 3,
      bgcolor: "primary.main",
      borderRadius: 2,
    },
  },
  "&.Mui-selected:hover": { bgcolor: "action.selected" },
} as const;

type MenuNode = {
  label: string;
  children?: MenuNode[];
};

const buildPath = (parent: string, label: string) =>
  parent ? `${parent}/${label}` : label;

const useMenuData = () => {
  /** ✅ MEJOR OPCIÓN: HOME como árbol */
  const home: MenuNode[] = [
    {
      label: "HOME",
      children: [{ label: "GENERAL" }, { label: "JEFE DE SECCIÓN" }],
    },
  ];

  const trazabilidad: MenuNode[] = [{ label: "TRAZABILIDAD" }];
  const selectorCaso: MenuNode[] = [{ label: "SELECTOR DE CASOS Y PRIORIZACIÓN" }];
  const priorizacion: MenuNode[] = [{ label: "VERIFICACIÓN" }];
  const aprobacion: MenuNode[] = [{ label: "APROBACIÓN" }];
  const asignacion: MenuNode[] = [{ label: "ASIGNACIÓN" }];

  const auditorias: MenuNode[] = [
    {
      label: "GESTIÓN DE AUDITORIA",
      children: [
        { label: "ACTA DE INICIO" },
        { label: "NOTIFICACIÓN ACTA DE INICIO" },
        { label: "PROCESO DE AUDITORIA" },
        { label: "SUPERVISOR" },
        { label: "DIRECTOR" },
        { label: "TRAMITE" },
        { label: "INFORME AUDITORIA" },
      ],
    },
    { label: "VARIACIÓN EN INGRESOS" },
    { label: "REVISIÓN SUPERVISOR" },
    { label: "REVISIÓN JEFE DE SECCIÓN" },
    { label: "PRESENTACIÓN VOLUNTARIA" },
    { label: "LIQUIDACIONES ADICIONALES" },
    { label: "ELIMINACIONES" },
    { label: "RECTIFICATIVA" },
    { label: "CIERRE" },
  ];

  const seguiemiento: MenuNode[] = [{ label: "SEGUIMIENTO Y CONTROL" }];

  const modulos: MenuNode[] = [
    {
      label: "MÓDULO COMUNICACIÓN",
      children: [{ label: "COMUNICACIONES" }, { label: "ENVIOS" }],
    },
    { label: "MÓDULO CONSULTAS" },
    { label: "MÓDULO ALERTAS" },
  ];

  return {
    home,
    trazabilidad,
    seguiemiento,
    auditorias,
    modulos,
    selectorCaso,
    priorizacion,
    aprobacion,
    asignacion,
  };
};

export const Sidebar: React.FC<SidebarProps> = ({ onSelect, selected }) => {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const {
    home,
    trazabilidad,
    seguiemiento,
    auditorias,
    modulos,
    selectorCaso,
    priorizacion,
    aprobacion,
    asignacion,
  } = useMenuData();

  const ROOTS = useMemo(
    () => ["SELECTOR DE CASOS Y PRIORIZACIÓN", "PROCESOS DE AUDITORIAS", "HOME"] as const,
    []
  );

  const toggleRoot = (root: typeof ROOTS[number]) => {
    setOpenMap((prev) => {
      const next = { ...prev };
      ROOTS.forEach((r) => {
        next[r] = r === root ? !prev[r] : false;
      });
      return next;
    });
  };

  const togglePath = (path: string) =>
    setOpenMap((prev) => ({ ...prev, [path]: !prev[path] }));

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
                <ListItemButton
                  onClick={() => togglePath(thisPath)}
                  sx={ITEM_STYLE}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {isOpen ? <ExpandLess /> : <ExpandMore />}
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

        return (
          <ListItem key={thisPath} disablePadding>
            <ListItemButton
              onClick={() => onSelect(thisPath)}
              selected={selected === thisPath}
              sx={ITEM_STYLE}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <ChevronRight />
              </ListItemIcon>
              <ListItemText primary={node.label} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Box
      sx={{
        width: 280,
        p: 1.5,
        pt: 0.5,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <List
        subheader={
          <ListSubheader
            disableSticky
            sx={{
              bgcolor: "transparent",
              fontWeight: 800,
              fontSize: 12,
              color: "text.disabled",
            }}
          >
            MENÚ PRINCIPAL
          </ListSubheader>
        }
      >
        {/* ✅ HOME (como árbol) */}
        <ListItemButton
          onClick={() => toggleRoot("HOME")}
          sx={SECTION_STYLE}
          selected={!!openMap["HOME"]}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            HOME
          </Typography>
          {openMap["HOME"] ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={!!openMap["HOME"]} timeout="auto" unmountOnExit>
          {renderNodes(home[0].children ?? [], "HOME")}
        </Collapse>

        <Divider sx={{ my: 1.5 }} />

        {/* TRAZABILIDAD */}
        {trazabilidad.map((t) => (
          <ListItemButton
            key={t.label}
            sx={{ ...SECTION_STYLE, py: 1 }}
            onClick={() => onSelect(t.label)}
            selected={selected === t.label}
          >
            <Typography variant="subtitle2">{t.label}</Typography>
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1.5 }} />

        {/* SELECTOR CASOS */}
        {selectorCaso.map((s) => (
          <ListItemButton
            key={s.label}
            sx={{ ...SECTION_STYLE, py: 1 }}
            onClick={() => onSelect(s.label)}
            selected={selected === s.label}
          >
            <Typography variant="subtitle2">{s.label}</Typography>
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1.5 }} />

        {/* VERIFICACIÓN */}
        {priorizacion.map((p) => (
          <ListItemButton
            key={p.label}
            sx={{ ...SECTION_STYLE, py: 1 }}
            onClick={() => onSelect(p.label)}
            selected={selected === p.label}
          >
            <Typography variant="subtitle2">{p.label}</Typography>
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1.5 }} />

        {/* APROBACIÓN */}
        {aprobacion.map((a) => (
          <ListItemButton
            key={a.label}
            sx={{ ...SECTION_STYLE, py: 1 }}
            onClick={() => onSelect(a.label)}
            selected={selected === a.label}
          >
            <Typography variant="subtitle2">{a.label}</Typography>
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1.5 }} />

        {/* ASIGNACIÓN */}
        {asignacion.map((a) => (
          <ListItemButton
            key={a.label}
            sx={{ ...SECTION_STYLE, py: 1 }}
            onClick={() => onSelect(a.label)}
            selected={selected === a.label}
          >
            <Typography variant="subtitle2">{a.label}</Typography>
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1.5 }} />

        {/* SEGUIMIENTO Y CONTROL */}
        {seguiemiento.map((a) => (
          <ListItemButton
            key={a.label}
            sx={{ ...SECTION_STYLE, py: 1 }}
            onClick={() => onSelect(a.label)}
            selected={selected === a.label}
          >
            <Typography variant="subtitle2">{a.label}</Typography>
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1.5 }} />

        {/* PROCESOS DE AUDITORIAS */}
        <ListItemButton
          onClick={() => toggleRoot("PROCESOS DE AUDITORIAS")}
          sx={SECTION_STYLE}
          selected={!!openMap["PROCESOS DE AUDITORIAS"]}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            PROCESOS DE AUDITORIAS
          </Typography>
          {openMap["PROCESOS DE AUDITORIAS"] ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={!!openMap["PROCESOS DE AUDITORIAS"]} timeout="auto" unmountOnExit>
          {renderNodes(auditorias, "PROCESOS DE AUDITORIAS")}
        </Collapse>

        <Divider sx={{ my: 1.5 }} />

        {/* MÓDULOS */}
        {modulos.map((m) => {
          const hasChildren = !!m.children?.length;
          const rootKey = m.label;
          const isOpen = !!openMap[rootKey];

          if (hasChildren) {
            return (
              <React.Fragment key={rootKey}>
                <ListItemButton
                  onClick={() => togglePath(rootKey)}
                  sx={SECTION_STYLE}
                  selected={isOpen}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {m.label}
                  </Typography>
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  {renderNodes(m.children!, rootKey)}
                </Collapse>

                <Divider sx={{ my: 1.5 }} />
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={rootKey}>
              <ListItemButton
                sx={{ ...SECTION_STYLE, py: 1 }}
                onClick={() => onSelect(rootKey)}
                selected={selected === rootKey}
              >
                <Typography variant="subtitle2">{m.label}</Typography>
              </ListItemButton>
              <Divider sx={{ my: 1.5 }} />
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};
