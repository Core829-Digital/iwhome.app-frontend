import AdminAppointments from './pages/AdminAppointments';
import Appuntamenti from './pages/Appuntamenti';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Calcolatore from './pages/Calcolatore';
import ChiSiamo from './pages/ChiSiamo';
import CompanyDashboard from './pages/CompanyDashboard';
import Contatti from './pages/Contatti';
import Cookie from './pages/Cookie';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MyAppointments from './pages/MyAppointments';
import PdfEditor from './pages/PdfEditor';
import Privacy from './pages/Privacy';
import Recensioni from './pages/Recensioni';
import Servizi from './pages/Servizi';
import Settings from './pages/Settings';
import SharedDocuments from './pages/SharedDocuments';
import Termini from './pages/Termini';
import UploadDocument from './pages/UploadDocument';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAppointments": AdminAppointments,
    "Appuntamenti": Appuntamenti,
    "Blog": Blog,
    "BlogPost": BlogPost,
    "Calcolatore": Calcolatore,
    "ChiSiamo": ChiSiamo,
    "CompanyDashboard": CompanyDashboard,
    "Contatti": Contatti,
    "Cookie": Cookie,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Home": Home,
    "Messages": Messages,
    "MyAppointments": MyAppointments,
    "PdfEditor": PdfEditor,
    "Privacy": Privacy,
    "Recensioni": Recensioni,
    "Servizi": Servizi,
    "Settings": Settings,
    "SharedDocuments": SharedDocuments,
    "Termini": Termini,
    "UploadDocument": UploadDocument,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};