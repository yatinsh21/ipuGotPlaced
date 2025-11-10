import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
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
  const { user } = useUser();
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [users, setUsers] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = user?.publicMetadata?.isAdmin;
  console.log(isAdmin);
  

  // Helper function to get auth config
  const getAuthConfig = async () => {
    const token = await getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      const config = await getAuthConfig();
      const [statsRes, topicsRes, questionsRes, companiesRes, experiencesRes, usersRes, alumniRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, config),
        axios.get(`${API}/topics`, config),
        axios.get(`${API}/admin/questions`, config),
        axios.get(`${API}/companies`, config),
        axios.get(`${API}/experiences`, config),
        axios.get(`${API}/admin/users`, config),
        axios.get(`${API}/admin/alumni`, config)
      ]);
      
      setStats(statsRes.data);
      setTopics(topicsRes.data);
      setQuestions(questionsRes.data);
      setCompanies(companiesRes.data);
      setExperiences(experiencesRes.data);
      setUsers(usersRes.data);
      setAlumni(alumniRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
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

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Alumni</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    <span className="text-3xl font-bold text-gray-900">{stats?.total_alumni || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Management Tabs */}
            <Tabs defaultValue="topics" className="space-y-4">
              <div className="overflow-x-auto scrollbar-hide">
  <TabsList className="bg-white border border-gray-200 inline-flex min-w-full md:min-w-0 w-max md:w-auto flex-nowrap md:flex-wrap">
    <TabsTrigger value="topics" className="whitespace-nowrap text-sm px-3 py-2">
      Topics
    </TabsTrigger>
    
    <TabsTrigger value="questions" className="whitespace-nowrap text-sm px-3 py-2">
      <span className="hidden sm:inline">Questions (Free)</span>
      <span className="sm:hidden">Questions</span>
    </TabsTrigger>
    
    <TabsTrigger value="companies" className="whitespace-nowrap text-sm px-3 py-2">
      <span className="hidden sm:inline">Companies (Goldmine)</span>
      <span className="sm:hidden">Companies</span>
    </TabsTrigger>
    
    <TabsTrigger value="company-questions" className="whitespace-nowrap text-sm px-3 py-2">
      <span className="hidden lg:inline">Company Questions (Premium)</span>
      <span className="hidden sm:inline lg:hidden">Co. Questions</span>
      <span className="sm:hidden">Co. Q</span>
    </TabsTrigger>
    
    <TabsTrigger value="experiences" className="whitespace-nowrap text-sm px-3 py-2">
      Experiences
    </TabsTrigger>
    
    <TabsTrigger value="alumni" className="whitespace-nowrap text-sm px-3 py-2">
      Alumni
    </TabsTrigger>
    
    <TabsTrigger value="users" className="whitespace-nowrap text-sm px-3 py-2">
      Users
    </TabsTrigger>
  </TabsList>
</div>

<style jsx>{`
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`}</style>
              <TabsContent value="topics">
                <TopicsManager topics={topics} setTopics={setTopics} fetchAllData={fetchAllData} getAuthConfig={getAuthConfig} />
              </TabsContent>

              <TabsContent value="questions">
                <TopicQuestionsManager 
                  questions={questions.filter(q => q.topic_id && !q.company_id)} 
                  topics={topics}
                  fetchAllData={fetchAllData} 
                  getAuthConfig={getAuthConfig}
                />
              </TabsContent>

              <TabsContent value="companies">
                <CompaniesManager companies={companies} setCompanies={setCompanies} fetchAllData={fetchAllData} getAuthConfig={getAuthConfig} />
              </TabsContent>

              <TabsContent value="company-questions">
                <CompanyQuestionsManager 
                  questions={questions.filter(q => q.company_id)} 
                  companies={companies}
                  fetchAllData={fetchAllData} 
                  getAuthConfig={getAuthConfig}
                />
              </TabsContent>

              <TabsContent value="experiences">
                <ExperiencesManager 
                  experiences={experiences} 
                  setExperiences={setExperiences} 
                  companies={companies}
                  fetchAllData={fetchAllData} 
                  getAuthConfig={getAuthConfig}
                />
              </TabsContent>

              <TabsContent value="alumni">
                <AlumniManager 
                  alumni={alumni} 
                  setAlumni={setAlumni}
                  fetchAllData={fetchAllData} 
                  getAuthConfig={getAuthConfig}
                />
              </TabsContent>

              <TabsContent value="users">
                <UsersManager users={users} onRefresh={fetchAllData} currentUser={user} getAuthConfig={getAuthConfig} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

// Topics Manager Component
const TopicsManager = ({ topics, fetchAllData, getAuthConfig }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/admin/topics/${editing.id}`, { ...editing, ...formData }, await getAuthConfig());
        toast.success('Topic updated');
      } else {
        await axios.post(`${API}/admin/topics`, formData, await getAuthConfig());
        toast.success('Topic created');
      }
      setOpen(false);
      setEditing(null);
      setFormData({ name: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/admin/topics/${id}`, await getAuthConfig());
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
              <Button onClick={() => { setEditing(null); setFormData({ name: '' }); }} data-testid="add-topic-btn">
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell className="font-medium">{topic.name}</TableCell>
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

// Topic Questions Manager Component (Free Questions)
const TopicQuestionsManager = ({ questions, topics, fetchAllData, getAuthConfig }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    difficulty: 'medium',
    topic_id: '',
    company_id: null,
    category: null,
    tags: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, company_id: null, category: null };
      if (editing) {
        await axios.put(`${API}/admin/questions/${editing.id}`, { ...editing, ...data }, await getAuthConfig());
        toast.success('Question updated');
      } else {
        await axios.post(`${API}/admin/questions`, data, await getAuthConfig());
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
      company_id: null,
      category: null,
      tags: []
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/admin/questions/${id}`, await getAuthConfig());
      toast.success('Question deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const getTopicName = (topicId) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || 'Unknown';
  };

  const filteredQuestions = questions.filter(q => {
    if (searchTerm && !q.question.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Topic Questions - Free ({questions.length} total)</CardTitle>
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
                  <Label>Topic</Label>
                  <Select value={formData.topic_id} onValueChange={(val) => setFormData({...formData, topic_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" data-testid="submit-question-btn">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <Label className="text-xs">Search</Label>
          <Input 
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="border border-gray-200 p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    Topic: {getTopicName(q.topic_id)}
                  </Badge>
                </div>
                <p className="font-medium text-gray-900 mb-1">{q.question}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{q.difficulty}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(q); setFormData({...q, tags: q.tags || [], topic_id: q.topic_id || '', company_id: null, category: null}); setOpen(true); }}>
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

// Company Questions Manager Component (Premium Goldmine Questions)
const CompanyQuestionsManager = ({ questions, companies, fetchAllData, getAuthConfig }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    difficulty: 'medium',
    topic_id: null,
    company_id: '',
    category: '',
    tags: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, topic_id: null };
      if (editing) {
        await axios.put(`${API}/admin/questions/${editing.id}`, { ...editing, ...data }, await getAuthConfig());
        toast.success('Question updated');
      } else {
        await axios.post(`${API}/admin/questions`, data, await getAuthConfig());
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
      topic_id: null,
      company_id: '',
      category: '',
      tags: []
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/admin/questions/${id}`, await getAuthConfig());
      toast.success('Question deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown';
  };

  const filteredQuestions = questions.filter(q => {
    // Filter by company
    if (selectedCompany !== 'all' && q.company_id !== selectedCompany) return false;
    
    // Filter by search
    if (searchTerm && !q.question.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Company Questions - Premium ({questions.length} total)</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); resetForm(); }} data-testid="add-company-question-btn">
              <Plus className="h-4 w-4 mr-2" /> Add Company Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Company Question' : 'Add New Company Question'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Question</Label>
                <Textarea 
                  value={formData.question} 
                  onChange={(e) => setFormData({...formData, question: e.target.value})} 
                  data-testid="company-question-input"
                  required 
                />
              </div>
              <div>
                <Label>Answer</Label>
                <Textarea 
                  value={formData.answer} 
                  onChange={(e) => setFormData({...formData, answer: e.target.value})} 
                  data-testid="company-answer-input"
                  rows={5}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(val) => setFormData({...formData, difficulty: val})}>
                    <SelectTrigger>
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
                  <Label>Company</Label>
                  <Select value={formData.company_id} onValueChange={(val) => setFormData({...formData, company_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (comma-separated: v.imp, just-read, fav)</Label>
                <Input 
                  value={formData.tags.join(', ')} 
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                  placeholder="v.imp, fav"
                />
              </div>
              <Button type="submit" data-testid="submit-company-question-btn">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex gap-4 items-center">
          <div>
            <Label className="text-xs">Filter by Company</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Search</Label>
            <Input 
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="border border-gray-200 p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {getCompanyName(q.company_id)}
                  </Badge>
                  {q.category && <Badge className="bg-purple-100 text-purple-800">{q.category}</Badge>}
                </div>
                <p className="font-medium text-gray-900 mb-1">{q.question}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{q.difficulty}</Badge>
                  {q.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(q); setFormData({...q, tags: q.tags || [], topic_id: null, company_id: q.company_id || '', category: q.category || ''}); setOpen(true); }}>
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
const CompaniesManager = ({ companies, fetchAllData, getAuthConfig }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', logo_url: '' });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const authConfig = await getAuthConfig();
      const response = await axios.post(`${API}/admin/upload-image`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          ...authConfig.headers
        }
      });

      setFormData(prev => ({ ...prev, logo_url: response.data.url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, question_count: 0 };
      if (editing) {
        await axios.put(`${API}/admin/companies/${editing.id}`, { ...editing, ...data }, await getAuthConfig());
        toast.success('Company updated');
      } else {
        await axios.post(`${API}/admin/companies`, data, await getAuthConfig());
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
      await axios.delete(`${API}/admin/companies/${id}`, await getAuthConfig());
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
          <CardTitle>Companies Management (Goldmine)</CardTitle>
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
                  <Label>Logo Image</Label>
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    data-testid="company-logo-upload"
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                </div>
                <div>
                  <Label>Or Logo URL</Label>
                  <Input 
                    value={formData.logo_url} 
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})} 
                    data-testid="company-logo-input"
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Preview" className="mt-2 h-16 w-16 object-contain border border-gray-200 p-2" />
                  )}
                </div>
                <Button type="submit" data-testid="submit-company-btn" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Save'}
                </Button>
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
const ExperiencesManager = ({ experiences, companies, fetchAllData, getAuthConfig }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rounds, setRounds] = useState([{ title: 'Round 1', description: '' }]);
  const [tips, setTips] = useState('');
  const [formData, setFormData] = useState({
    company_id: '',
    company_name: '',
    role: '',
    rounds: 1,
    experience: '',
    status: 'selected'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Build experience text from rounds and tips
      let experienceText = rounds.map((round, i) => 
        `Round ${i + 1}: ${round.description}`
      ).join('\\n');
      
      if (tips) {
        experienceText += `\\n\\nTips: ${tips}`;
      }

      const dataToSubmit = {
        ...formData,
        experience: experienceText,
        rounds: rounds.length
      };

      if (editing) {
        await axios.put(`${API}/admin/experiences/${editing.id}`, { ...editing, ...dataToSubmit }, await getAuthConfig());
        toast.success('Experience updated');
      } else {
        await axios.post(`${API}/admin/experiences`, dataToSubmit, await getAuthConfig());
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
    setFormData({ company_id: '', company_name: '', role: '', rounds: 1, experience: '', status: 'selected' });
    setRounds([{ title: 'Round 1', description: '' }]);
    setTips('');
  };

  const parseExperienceForEdit = (experienceText) => {
    // Split by \n and parse rounds and tips
    const lines = experienceText.split('\\n').filter(line => line.trim());
    const parsedRounds = [];
    let parsedTips = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if it's a round line
      if (trimmedLine.match(/^Round \d+:/i)) {
        const [title, ...descParts] = trimmedLine.split(':');
        parsedRounds.push({
          title: title.trim(),
          description: descParts.join(':').trim()
        });
      } else if (trimmedLine.match(/^(Tips?|Focus):/i)) {
        // Extract tips
        const [, ...tipsParts] = trimmedLine.split(':');
        parsedTips = tipsParts.join(':').trim();
      }
    });
    
    return {
      rounds: parsedRounds.length > 0 ? parsedRounds : [{ title: 'Round 1', description: '' }],
      tips: parsedTips
    };
  };

  const handleEdit = (exp) => {
    setEditing(exp);
    setFormData({
      company_id: exp.company_id,
      company_name: exp.company_name,
      role: exp.role,
      rounds: exp.rounds,
      experience: exp.experience,
      status: exp.status || 'selected'
    });
    
    // Parse the experience text to populate rounds and tips
    const parsed = parseExperienceForEdit(exp.experience);
    setRounds(parsed.rounds);
    setTips(parsed.tips);
    setOpen(true);
  };

  const addRound = () => {
    setRounds([...rounds, { title: `Round ${rounds.length + 1}`, description: '' }]);
  };

  const removeRound = (index) => {
    if (rounds.length > 1) {
      setRounds(rounds.filter((_, i) => i !== index));
    }
  };

  const updateRound = (index, description) => {
    const newRounds = [...rounds];
    newRounds[index].description = description;
    setRounds(newRounds);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API}/admin/experiences/${id}`, await getAuthConfig());
      toast.success('Experience deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'selected': return 'bg-green-100 text-green-800';
      case 'not selected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Experience' : 'Add New Experience'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div>
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({...formData, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not selected">Not Selected</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Interview Rounds</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addRound}>
                      <Plus className="h-3 w-3 mr-1" /> Add Round
                    </Button>
                  </div>
                  {rounds.map((round, index) => (
                    <div key={index} className="mb-3 p-3 border border-gray-200 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{round.title}</span>
                        {rounds.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeRound(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <textarea
  value={round.description}
  onChange={(e) => updateRound(index, e.target.value)}
  placeholder="e.g., Coding round - two medium level problems"
  required
  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  rows={3}
/>

                    </div>
                  ))}
                </div>

                <div>
                  <Label>Tips / Focus Areas (Optional)</Label>
                  <Textarea 
                    value={tips}
                    onChange={(e) => setTips(e.target.value)}
                    rows={3}
                    placeholder="e.g., Focus on: System design, Clean code, Azure knowledge"
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{exp.company_name}</h3>
                    <Badge className={getStatusColor(exp.status || 'selected')}>
                      {exp.status || 'selected'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{exp.role} • {exp.rounds} rounds</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(exp)}>
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
const UsersManager = ({ users, onRefresh, currentUser, getAuthConfig }) => {
  
  const handleGrantAdmin = async (userId, userName) => {
    if (!window.confirm(`Grant admin access to ${userName}? They will also get premium access.`)) {
      return;
    }
    
    try {
      await axios.post(`${API}/admin/users/${userId}/grant-admin`, {}, await getAuthConfig());
      toast.success('Admin access granted successfully');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to grant admin access');
    }
  };
  
  const handleRevokeAdmin = async (userId, userName) => {
    if (!window.confirm(`Revoke admin access from ${userName}? They will keep premium status.`)) {
      return;
    }
    
    try {
      await axios.post(`${API}/admin/users/${userId}/revoke-admin`, {}, await getAuthConfig());
      toast.success('Admin access revoked successfully');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to revoke admin access');
    }
  };
  
  const handleTogglePremium = async (userId, userName, isPremium) => {
    const action = isPremium ? 'revoke' : 'grant';
    if (!window.confirm(`${action === 'grant' ? 'Grant' : 'Revoke'} premium access ${action === 'grant' ? 'to' : 'from'} ${userName}?`)) {
      return;
    }
    
    try {
      await axios.post(`${API}/admin/users/${userId}/toggle-premium`, {}, await getAuthConfig());
      toast.success(`Premium access ${action === 'grant' ? 'granted' : 'revoked'} successfully`);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update premium status');
    }
  };
  
  return (
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <CardTitle>Users Management ({users.length})</CardTitle>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.is_admin && <Badge className="bg-gray-900 text-white">Admin</Badge>}
                      {user.is_premium && <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>}
                      {!user.is_premium && !user.is_admin && <Badge variant="outline">Free</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{user.bookmarked_questions?.length || 0}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!user.is_admin ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleGrantAdmin(user.id, user.name)}
                          className="text-xs"
                        >
                          Make Admin
                        </Button>
                      ) : (
                        user.id !== currentUser.id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRevokeAdmin(user.id, user.name)}
                            className="text-xs"
                          >
                            Remove Admin
                          </Button>
                        )
                      )}
                      {!user.is_admin && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTogglePremium(user.id, user.name, user.is_premium)}
                          className="text-xs"
                        >
                          {user.is_premium ? 'Remove Premium' : 'Make Premium'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Alumni Manager Component
const AlumniManager = ({ alumni, fetchAllData, getAuthConfig }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    company: '',
    years_of_experience: '',
    location: '',
    graduation_year: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        phone: formData.phone || null,
        location: formData.location || null
      };

      if (editing) {
        await axios.put(`${API}/admin/alumni/${editing.id}`, { ...editing, ...data }, await getAuthConfig());
        toast.success('Alumni updated');
      } else {
        await axios.post(`${API}/admin/alumni`, data, await getAuthConfig());
        toast.success('Alumni created');
      }
      setOpen(false);
      setEditing(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        company: '',
        years_of_experience: '',
        location: '',
        graduation_year: ''
      });
      fetchAllData();
    } catch (error) {
      console.error('Failed to save alumni:', error);
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alumni record?')) return;
    try {
      await axios.delete(`${API}/admin/alumni/${id}`, await getAuthConfig());
      toast.success('Alumni deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const startEdit = (alumni) => {
    setEditing(alumni);
    setFormData({
      name: alumni.name,
      email: alumni.email,
      phone: alumni.phone || '',
      role: alumni.role,
      company: alumni.company,
      years_of_experience: alumni.years_of_experience || '',
      location: alumni.location || '',
      graduation_year: alumni.graduation_year || ''
    });
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Alumni Management</CardTitle>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditing(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                role: '',
                company: '',
                years_of_experience: '',
                location: '',
                graduation_year: ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Alumni
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Alumni' : 'Add Alumni'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Role *</Label>
                    <Input
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <Label>Company *</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., Google"
                    />
                  </div>
                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      value={formData.years_of_experience}
                      onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  <div>
                    <Label>Graduation Year</Label>
                    <Input
                      type="number"
                      value={formData.graduation_year}
                      onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editing ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Grad Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alumni.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell className="text-sm">{person.email}</TableCell>
                  <TableCell className="text-sm">{person.phone || '-'}</TableCell>
                  <TableCell className="text-sm">{person.role}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{person.company}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {person.years_of_experience ? `${person.years_of_experience} yrs` : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{person.location || '-'}</TableCell>
                  <TableCell className="text-sm">{person.graduation_year || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(person)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(person.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
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