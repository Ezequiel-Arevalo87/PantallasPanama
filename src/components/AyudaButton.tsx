import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export const AyudaButton: React.FC<{ titulo: string; contenido: string }> = ({ titulo, contenido }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
       
        <IconButton onClick={() => setOpen(true)}><SearchIcon /></IconButton>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogContent dividers>
          <Typography whiteSpace="pre-wrap">{contenido}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} variant="contained">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
