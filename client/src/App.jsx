import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import AuditorDetail from './pages/AuditorDetail';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import NewFailure from './pages/NewFailure';
import FailureDetail from './pages/FailureDetail';
import Checklist from './pages/Checklist';
import Standards from './pages/Standards';
import Tools from './pages/Tools';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="audits" element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<NewProject />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/failures/new" element={<NewFailure />} />
        <Route path="projects/:id/failures/:failureId" element={<FailureDetail />} />
        <Route path="projects/:id/failures/:failureId/edit" element={<NewFailure />} />
        <Route path="projects/:id/scope/:scopeItemId/checklist" element={<Checklist />} />
        <Route path="auditors/:auditorName" element={<AuditorDetail />} />
        <Route path="standards" element={<Standards />} />
        <Route path="tools" element={<Tools />} />
      </Route>
    </Routes>
  );
}
