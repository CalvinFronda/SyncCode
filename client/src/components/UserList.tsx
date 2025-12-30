interface User {
  name: string;
  color: string;
}

interface UserListProps {
  users: User[];
  currentUser: User;
}

function UserList({ users, currentUser }: UserListProps) {
  return (
    <div className="user-list">
      <span className="connected-users"> Connected Users ({users.length})</span>{" "}
      <ul>
        {users.map((user, index) => (
          <li key={index} style={{ color: user.color }}>
            {user.name} {user.name === currentUser.name ? "(You)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
