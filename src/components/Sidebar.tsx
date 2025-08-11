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
     
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        FISCALIZACIÓN
      </Typography>

      <List dense>
        {[
          
          'SELECCIÓN DE CASOS',
          'PRIORIZACIÓN',
          'APROBACIÓN',
          'ASIGNACIÓN',
        
        ].map((op) => (
          <ListItem key={op} disablePadding>
            <ListItemButton onClick={() => onSelect(op)}>
              <ListItemText primary={op} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
   

      <Divider sx={{ my: 1 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
       PROCESOS DE AUDITORIAS
      </Typography>
      <List dense>
        {[
          'PROGRAMACIÓN DE AUDITORIAS',
          // 'ASIGNACIÓN',
          'REVISIÓN AUDITOR',
          'REVISIÓN SUPERVISOR',
          'REVISIÓN JEFE DE SECCIÓN',
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
