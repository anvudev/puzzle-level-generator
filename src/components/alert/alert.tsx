import { AlertDialog, AlertDialogTrigger } from "../ui/simple-alert-dialog";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { AlertDialogContent } from "../ui/simple-alert-dialog";
import { AlertDialogHeader } from "../ui/simple-alert-dialog";
import { AlertDialogTitle } from "../ui/simple-alert-dialog";
import { AlertDialogDescription } from "../ui/simple-alert-dialog";
import { AlertDialogFooter } from "../ui/simple-alert-dialog";
import { AlertDialogCancel } from "../ui/simple-alert-dialog";
import { AlertDialogAction } from "../ui/simple-alert-dialog";

export const AlertDialogUI = ({
  title,
  description,
  onConfirm,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Xóa
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa &quot;{description}
            &quot;? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
