import AdminProductosVista from './AdminProductosVista'
import { useAdminProductosHttp } from '../utilidades/useAdminProductosHttp'

function AdminProductosHttp() {
    const administracion = useAdminProductosHttp()
    return <AdminProductosVista {...administracion} />
}

export default AdminProductosHttp
