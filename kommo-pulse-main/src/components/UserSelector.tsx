import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

interface UserSelectorProps {
  users: Array<{ user_id: string; name: string }>;
  selectedUser: string;
  onUserChange: (userId: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ users, selectedUser, onUserChange }) => {
  return (
    <div className="flex items-center gap-3">
      <User className="h-5 w-5 text-primary" />
      <Select value={selectedUser} onValueChange={onUserChange}>
        <SelectTrigger className="w-[250px] bg-secondary border-border/50">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id}>
              {user.name || `User ${user.user_id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;