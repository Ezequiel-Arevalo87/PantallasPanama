import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';

type Props = {
  onSelect: (op: string) => void;
};

export const Sidebar = ({ onSelect }: Props) => {
  return (
    <>
      {/* SELECTOR DE CASOS */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        SELECTOR DE CASOS
      </Typography>

      <List dense>
        {[
          'APROBACIÓN',
          'INICIO DEL SELECTOR',
        
        ].map((op) => (
          <ListItem key={op} disablePadding>
            <ListItemButton onClick={() => onSelect(op)}>
              <ListItemText primary={op} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
   

      <Divider sx={{ my: 1 }} />

      {/* SEGUIMIENTO Y CONTROL */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        SEGUIMIENTO Y CONTROL
      </Typography>
      <List dense>
        {[
          'PROGRAMACIÓN DE AUDITORIAS',
          'ASIGNACIÓN',
          'PRESENTACIÓN VOLUNTARIA',
          'LIQUIDACIONES ADICIONALES',
          'ELIMINACIONES',
          'RECTIFICATIVA',
          'CIERRE'
        ].map((op) => (
          <ListItem key={op} disablePadding>
            <ListItemButton onClick={() => onSelect(op)}>
              <ListItemText primary={op} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* OTROS MÓDULOS */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        MÓDULO COMUNICACIÓN
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        MÓDULO CONSULTAS
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        MÓDULO ALERTAS
      </Typography>
    </>
  );
};
