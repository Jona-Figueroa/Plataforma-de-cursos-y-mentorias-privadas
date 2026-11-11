const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// 1. Servir archivos estáticos de la carpeta 'public' primero
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a Supabase usando las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PORT = process.env.PORT || 3000;

// Ruta de prueba para la API (opcional)
app.get('/api', (req, res) => {
  res.json({ message: 'API de plataforma de cursos funcionando correctamente 🚀' });
});

// Ruta para obtener los cursos disponibles
app.get('/api/courses', async (req, res) => {
  const { data, error } = await supabase.from('courses').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// --- RUTAS DE AUTENTICACIÓN ---

// 1. Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  const user = data.user;

  if (user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: user.id, email: user.email, full_name }]);

    if (profileError) return res.status(400).json({ error: profileError.message });
  }

  res.json({ 
    message: 'Usuario registrado exitosamente.', 
    user 
  });
});

// 2. Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    message: 'Inicio de sesión exitoso',
    session: data.session,
    user: data.user
  });
});

// --- RUTA PARA PROCESAR Y REGISTRAR COMPRAS (Simulación) ---
app.post('/api/purchase', async (req, res) => {
  const { user_id, course_id, amount, paypal_order_id } = req.body;

  const { data, error } = await supabase
    .from('purchases')
    .insert([
      { 
        user_id, 
        course_id, 
        amount, 
        payment_status: 'completed', 
        paypal_order_id: paypal_order_id || 'SIM-PAYPAL-' + Math.floor(Math.random() * 1000000) 
      }
    ])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.json({
    message: '¡Pago simulado procesado y curso adquirido con éxito! 🎉',
    purchase: data[0]
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});