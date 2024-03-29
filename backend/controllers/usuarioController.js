import Usuario from '../models/Usuario.js';
import generarId from '../helpers/generarId.js';
import generarJWT from '../helpers/generarJWT.js';
import jwt from 'jsonwebtoken';

const registrar = async (req, res) => {
    // Evitar registros duplicados
    const { email } = req.body;
    const existeUsuario = await Usuario.findOne({ email });

    if (existeUsuario) {
        const error = new Error("Usuario ya Registrado");
        return res.status(400).json({ msg: error.message });
    }
    try {
        const usuario = new Usuario(req.body);
        usuario.token = generarId();
        await usuario.save();
        res.json({ msg: 'Usuario Creado Correctamente', pass: true, token: generarJWT({ id: usuario.token, nombre: usuario.nombre }) });
    } catch (error) {
        console.log(error);
    }

};

const autenticar = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body)
    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
        const error = new Error("El usuario no existe");
        return res.status(404).json({ msg: error.message });
    }

    // comprobar su password
    if (await usuario.comprobarPassword(password)) {
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario._id),
        })
    } else {
        const error = new Error("El Password es Incorrecto");
        return res.status(403).json({ msg: error.message });
    }
};

const confirmar = async (req, res) => {
    const { token } = req.body;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) res.json({ msg: 'Token no valido', validate: false });
            res.json({ msg: 'Token Valido', validate: true, usuario: decoded });
        });
    } else {
        return res.json({
            msg: "Token no valido",
            validate: false
        })
    }

};

const olvidePassword = async (req, res) => {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
        const error = new Error("El usuario no existe");
        return res.status(404).json({ msg: error.message });
    }

    try {
        usuario.token = generarId();
        await usuario.save();
        res.json({ msg: "Hemos enviado un email con las instrucciones" });
    } catch (error) {
        console.log(error);
    }
};

const comprobarToken = async (req, res) => {
    const { token } = req.params;

    const tokenValido = await Usuario.findOne({ token });

    if (tokenValido) {
        res.json({ msg: "Token válido y el usuario existe" });
    } else {
        const error = new Error("Token no Valido");
        return res.status(404).json({ msg: error.message });
    }
};

const nuevoPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const usuario = await Usuario.findOne({ token });

    if (usuario) {
        usuario.password = password;
        usuario.token = '';
        try {
            await usuario.save();
            res.json({ msg: 'Password Modificado Correctamente' });
        } catch (error) {
            console.log(error);
        }

    } else {
        const error = new Error("Token no Valido");
        return res.status(404).json({ msg: error.message });
    }
};

const perfil = async (req, res) => {
    const { usuario } = req;

    res.json(usuario);
}

export { registrar, autenticar, confirmar, olvidePassword, comprobarToken, nuevoPassword, perfil };