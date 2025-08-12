import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export const FormAutoApertura: React.FC<{
  rucInicial: string;
  onConsultar: (ruc: string) => void;
  onVolver?: () => void;
}> = ({ rucInicial, onConsultar, onVolver }) => {
  const [ruc, setRuc] = useState(rucInicial);

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography align="center" color="error" fontWeight={700} mb={2}>
          AUTO DE APERTURA
        </Typography>

        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={0}>
              <Box
                sx={{
                  bgcolor: '#EEF6E9',
                  border: '1px solid #C7D7C1',
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  borderRight: 'none',
                  borderRadius: '4px 0 0 4px',
                  minWidth: 90,
                }}
              >
                <Typography fontWeight={700}>RUC*</Typography>
              </Box>
              <TextField
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                size="small"
                fullWidth
                sx={{ '& .MuiInputBase-input': { textAlign: 'center' }, borderRadius: '0 4px 4px 0' }}
              />
            </Stack>
          </Grid>

          <Grid item xs="auto">
            <Button variant="contained" color="success" onClick={() => onConsultar(ruc.trim())} startIcon={<SearchIcon />} sx={{ px: 4 }}>
              CONSULTAR
            </Button>
          </Grid>

          {onVolver && (
            <Grid item xs={12} sm="auto">
              <Button onClick={onVolver}>Volver</Button>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};
