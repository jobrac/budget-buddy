import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  CreditCard,
  Briefcase,
  Users,
  Repeat,
  PieChart,
  BrainCircuit,
  ArrowRightLeft,
} from 'lucide-react';

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <ArrowRightLeft className="w-full h-full" />,
    title: 'Transaction Tracking',
    description: 'Log income and expenses with ease, and categorize them for better insights.',
  },
  {
    icon: <CreditCard className="w-full h-full" />,
    title: 'Multi-Account Support',
    description: 'Manage multiple accounts like cash, bank, or cards and transfer funds between them.',
  },
  {
    icon: <Briefcase className="w-full h-full" />,
    title: 'Project-Based Budgeting',
    description: 'Create separate budgets for different projects like home, office, or a vacation.',
  },
  {
    icon: <Users className="w-full h-full" />,
    title: 'Collaborative Budgets',
    description: 'Invite others to your projects with role-based permissions for shared financial management.',
  },
  {
    icon: <Repeat className="w-full h-full" />,
    title: 'Recurring Transactions',
    description: 'Automate your recurring income and expenses to save time and avoid missing payments.',
  },
  {
    icon: <PieChart className="w-full h-full" />,
    title: 'Visual Reports',
    description: 'Understand your spending habits with intuitive pie charts and bar graphs.',
  },
  {
    icon: <BrainCircuit className="w-full h-full" />,
    title: 'Smart Goal Setting',
    description: 'Get AI-powered budget goal suggestions based on your financial history and project type.',
  },
];

export default function Features() {
  return (
    <section id="features" className="container py-24 sm:py-32 space-y-8">
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center font-headline">
        Many{" "}
        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Great Features
        </span>
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ icon, title, description }) => (
          <Card key={title} className="bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/80 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4 p-2.5">
                {icon}
              </div>
              <CardTitle className="font-headline">{title}</CardTitle>
              <CardDescription className="pt-2">{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
