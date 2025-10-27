import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '@/App';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Building2, FileText, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      const [statsRes, topicsRes, questionsRes, companiesRes, experiencesRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/topics`, { withCredentials: true }),
        axios.get(`${API}/admin/questions`, { withCredentials: true }),
        axios.get(`${API}/companies`, { withCredentials: true }),
        axios.get(`${API}/experiences`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true })
      ]);
      
      setStats(statsRes.data);
      setTopics(topicsRes.data);
      setQuestions(questionsRes.data);
      setCompanies(companiesRes.data);
      setExperiences(experiencesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-lg text-gray-600">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage all platform content and users</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-3xl font-bold text-gray-900">{stats?.total_users || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Premium Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-yellow-500" />
                    <span className="text-3xl font-bold text-gray-900">{stats?.premium_users || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <span className="text-3xl font-bold text-gray-900">{stats?.total_questions || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Companies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <span className="text-3xl font-bold text-gray-900">{stats?.total_companies || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Experiences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span className="text-3xl font-bold text-gray-900">{stats?.total_experiences || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Management Tabs */}
            <Tabs defaultValue="topics" className="space-y-4">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="companies">Companies</TabsTrigger>
                <TabsTrigger value="experiences">Experiences</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value="topics">
                <TopicsManager topics={topics} setTopics={setTopics} fetchAllData={fetchAllData} />
              </TabsContent>

              <TabsContent value="questions">
                <QuestionsManager 
                  questions={questions} 
                  setQuestions={setQuestions} 
                  topics={topics}
                  companies={companies}
                  fetchAllData={fetchAllData} 
                />
              </TabsContent>

              <TabsContent value="companies">
                <CompaniesManager companies={companies} setCompanies={setCompanies} fetchAllData={fetchAllData} />
              </TabsContent>

              <TabsContent value="experiences">
                <ExperiencesManager 
                  experiences={experiences} 
                  setExperiences={setExperiences} 
                  companies={companies}
                  fetchAllData={fetchAllData} 
                />
              </TabsContent>

              <TabsContent value="users">
                <UsersManager users={users} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

// Topics Manager Component
const TopicsManager = ({ topics, fetchAllData }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/admin/topics/${editing.id}`, { ...editing, ...formData }, { withCredentials: true });
        toast.success('Topic updated');
      } else {
        await axios.post(`${API}/admin/topics`, formData, { withCredentials: true });
        toast.success('Topic created');
      }
      setOpen(false);
      setEditing(null);
      setFormData({ name: '', description: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/admin/topics/${id}`, { withCredentials: true });
      toast.success('Topic deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Topics Management</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setFormData({ name: '', description: '' }); }} data-testid="add-topic-btn">
                <Plus className="h-4 w-4 mr-2" /> Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Topic' : 'Add New Topic'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    data-testid="topic-name-input"
                    required 
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    data-testid="topic-description-input"
                    required 
                  />
                </div>
                <Button type="submit" data-testid="submit-topic-btn">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell className="font-medium">{topic.name}</TableCell>
                <TableCell>{topic.description}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setEditing(topic); setFormData(topic); setOpen(true); }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(topic.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Questions Manager Component
const QuestionsManager = ({ questions, topics, companies, fetchAllData }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    difficulty: 'medium',
    topic_id: '',
    company_id: '',
    category: '',
    tags: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, topic_id: formData.topic_id || null, company_id: formData.company_id || null };
      if (editing) {
        await axios.put(`${API}/admin/questions/${editing.id}`, { ...editing, ...data }, { withCredentials: true });
        toast.success('Question updated');
      } else {
        await axios.post(`${API}/admin/questions`, data, { withCredentials: true });
        toast.success('Question created');
      }
      setOpen(false);
      setEditing(null);
      resetForm();
      fetchAllData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      difficulty: 'medium',
      topic_id: '',
      company_id: '',
      category: '',
      tags: []
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/admin/questions/${id}`, { withCredentials: true });
      toast.success('Question deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Questions Management ({questions.length})</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); resetForm(); }} data-testid="add-question-btn">
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Question' : 'Add New Question'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Question</Label>
                <Textarea 
                  value={formData.question} 
                  onChange={(e) => setFormData({...formData, question: e.target.value})} 
                  data-testid="question-input"
                  required 
                />
              </div>
              <div>
                <Label>Answer</Label>
                <Textarea 
                  value={formData.answer} 
                  onChange={(e) => setFormData({...formData, answer: e.target.value})} 
                  data-testid="answer-input"
                  rows={5}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(val) => setFormData({...formData, difficulty: val})}>
                    <SelectTrigger data-testid="difficulty-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Topic (Optional)</Label>
                  <Select value={formData.topic_id} onValueChange={(val) => setFormData({...formData, topic_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company (Optional)</Label>
                  <Select value={formData.company_id} onValueChange={(val) => setFormData({...formData, company_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category (Optional)</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tags (comma-separated: v.imp, just-read, fav)</Label>
                <Input 
                  value={formData.tags.join(', ')} 
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                  placeholder="v.imp, fav"
                />
              </div>
              <Button type="submit" data-testid="submit-question-btn">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {questions.map((q) => (
            <div key={q.id} className="border border-gray-200 p-4 flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">{q.question}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{q.difficulty}</Badge>
                  {q.category && <Badge variant="outline">{q.category}</Badge>}
                  {q.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(q); setFormData({...q, tags: q.tags || []}); setOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Companies Manager Component
const CompaniesManager = ({ companies, fetchAllData }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', logo_url: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, question_count: 0 };
      if (editing) {
        await axios.put(`${API}/admin/companies/${editing.id}`, { ...editing, ...data }, { withCredentials: true });
        toast.success('Company updated');
      } else {
        await axios.post(`${API}/admin/companies`, data, { withCredentials: true });
        toast.success('Company created');
      }
      setOpen(false);
      setEditing(null);
      setFormData({ name: '', logo_url: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will delete all company questions.')) return;
    try {
      await axios.delete(`${API}/admin/companies/${id}`, { withCredentials: true });
      toast.success('Company deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Companies Management</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setFormData({ name: '', logo_url: '' }); }} data-testid="add-company-btn">
                <Plus className="h-4 w-4 mr-2" /> Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Company' : 'Add New Company'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    data-testid="company-name-input"
                    required 
                  />
                </div>
                <div>
                  <Label>Logo URL (Optional)</Label>
                  <Input 
                    value={formData.logo_url} 
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})} 
                    data-testid="company-logo-input"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <Button type="submit" data-testid="submit-company-btn">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} className="border-2 border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900">{company.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(company); setFormData(company); setOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(company.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{company.question_count} questions</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Experiences Manager Component
const ExperiencesManager = ({ experiences, companies, fetchAllData }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    company_name: '',
    role: '',
    rounds: 1,
    experience: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/admin/experiences/${editing.id}`, { ...editing, ...formData }, { withCredentials: true });
        toast.success('Experience updated');
      } else {
        await axios.post(`${API}/admin/experiences`, formData, { withCredentials: true });
        toast.success('Experience created');
      }
      setOpen(false);
      setEditing(null);
      resetForm();
      fetchAllData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ company_id: '', company_name: '', role: '', rounds: 1, experience: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/admin/experiences/${id}`, { withCredentials: true });
      toast.success('Experience deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Interview Experiences Management</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); resetForm(); }} data-testid="add-experience-btn">
                <Plus className="h-4 w-4 mr-2" /> Add Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Experience' : 'Add New Experience'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Company</Label>
                  <Select 
                    value={formData.company_id} 
                    onValueChange={(val) => {
                      const company = companies.find(c => c.id === val);
                      setFormData({...formData, company_id: val, company_name: company?.name || ''});
                    }}
                  >
                    <SelectTrigger data-testid="experience-company-select">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Role</Label>
                  <Input 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})} 
                    data-testid="experience-role-input"
                    placeholder="Software Engineer"
                    required 
                  />
                </div>
                <div>
                  <Label>Number of Rounds</Label>
                  <Input 
                    type="number" 
                    value={formData.rounds} 
                    onChange={(e) => setFormData({...formData, rounds: parseInt(e.target.value)})} 
                    data-testid="experience-rounds-input"
                    min="1"
                    required 
                  />
                </div>
                <div>
                  <Label>Experience</Label>
                  <Textarea 
                    value={formData.experience} 
                    onChange={(e) => setFormData({...formData, experience: e.target.value})} 
                    data-testid="experience-text-input"
                    rows={8}
                    placeholder="Describe the interview experience..."
                    required 
                  />
                </div>
                <Button type="submit" data-testid="submit-experience-btn">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {experiences.map((exp) => (
            <div key={exp.id} className="border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{exp.company_name}</h3>
                  <p className="text-sm text-gray-600">{exp.role} • {exp.rounds} rounds</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(exp); setFormData(exp); setOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{exp.experience}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Users Manager Component
const UsersManager = ({ users }) => {
  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <CardTitle>Users ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bookmarks</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.is_premium && <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>}
                      {user.is_admin && <Badge className="bg-gray-900 text-white">Admin</Badge>}
                      {!user.is_premium && !user.is_admin && <Badge variant="outline">Free</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{user.bookmarked_questions?.length || 0}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPanel;