import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ref, update } from "firebase/database";
import { rtdb } from "../firebase/firebase";
import toast from "react-hot-toast";

export function UserProfileEditComponent({ isOpen, onClose, user }) {
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const handleSaveChanges = async () => {
    if (!user?.uid) {
      console.error("User ID is not available.");
      return;
    }
    if (!fullName || !username) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      const userRef = ref(rtdb, `users/${user?.uid}`);
      await update(userRef, {
        fullName,
        username,
      });
      toast.success("Profile updated successfully!");
      onClose(); // Close the modal after saving changes
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={fullName}
              className="col-span-3 bg-[#01aa851d] text-[#004939f3]"
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              className="col-span-3 bg-[#01aa851d] text-[#004939f3]"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="bg-[#01aa85]"
            type="submit"
            onClick={handleSaveChanges}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
