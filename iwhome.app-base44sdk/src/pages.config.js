import Admin from './pages/Admin';
import Appuntamenti from './pages/Appuntamenti';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Calcolatore from './pages/Calcolatore';
import Certificati from './pages/Certificati';
import ChiSiamo from './pages/ChiSiamo';
// import ClientChat from './pages/ClientChat'; // Removed
import Collaboratori from './pages/Collaboratori';
import CompanyDashboard from './pages/CompanyDashboard';
import CantieriDashboard from './pages/CantieriDashboard';
import Contatti from './pages/Contatti';
import Cookie from './pages/Cookie';
import Clienti from './pages/Clienti';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Fornitori from './pages/Fornitori';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MyAppointments from './pages/MyAppointments';
import Pagamenti from './pages/Pagamenti';
import PdfEditor from './pages/PdfEditor';
import Preventivi from './pages/Preventivi';
import Privacy from './pages/Privacy';
import Recensioni from './pages/Recensioni';
import Servizi from './pages/Servizi';
import Settings from './pages/Settings';
import SharedDocuments from './pages/SharedDocuments';
import StaffQR from './pages/StaffQR';
import Termini from './pages/Termini';
import UploadDocument from './pages/UploadDocument';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Appuntamenti": Appuntamenti,
    "Blog": Blog,
    "BlogPost": BlogPost,
    "Calcolatore": Calcolatore,
    "Certificati": Certificati,
    "ChiSiamo": ChiSiamo,
    "ClientChat": Messages, // Redirected to Messages (Unified)
    "Collaboratori": Collaboratori,
    "CompanyDashboard": CompanyDashboard,
    "CantieriDashboard": CantieriDashboard,
    "Contatti": Contatti,
    "Cookie": Cookie,
    "Clienti": Clienti,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Fornitori": Fornitori,
    "Home": Home,
    "Messages": Messages,
    "MyAppointments": MyAppointments,
    "Pagamenti": Pagamenti,
    "PdfEditor": PdfEditor,
    "Preventivi": Preventivi,
    "Privacy": Privacy,
    "Recensioni": Recensioni,
    "Servizi": Servizi,
    "Settings": Settings,
    "SharedDocuments": SharedDocuments,
    "StaffQR": StaffQR,
    "Termini": Termini,
    "UploadDocument": UploadDocument,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
