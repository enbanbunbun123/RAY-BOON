import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WordDef } from "../../../../atom/FlashCardsDataState";
import { Proficiency } from "../../../../atom/FlashCardsDataState";
import { generateExample, generateExampleReturn } from "../../../../lib/createExample";
import { useRecoilValue } from "recoil";
import { APIKeyState } from "../../../../atom/APIKeyState";
import { Toast } from "react-native-toast-message/lib/src/Toast";

interface EditWordModalProps {
    isEditOpen: boolean;
    item?: {
        id: number;
        name?: string;
        mean?: string;
        lang?: string;
        example?: string;
        proficiency?: Proficiency;
    };
    handleEditClose: () => void;
    setWordsData: Dispatch<SetStateAction<WordDef[]>>;
    OpenCreateExampleErrorMessage: (result: generateExampleReturn) => void;
}

export const EditWordModal: FC<EditWordModalProps> = ({
    isEditOpen, 
    item,
    handleEditClose,
    setWordsData,
    OpenCreateExampleErrorMessage,
}) => {    
    const [wordName, setWordName] = useState<string>(item?.name || "");
    const [wordMean, setWordMean] = useState<string>(item?.mean || "");
    const [wordLang, setWordLang] = useState<string>(item?.lang || "");
    const [wordExample, setWordExample] = useState<string>(item?.example || "");
    const [loading, setLoading] = useState<boolean>(false);
    const [wordExamplePreview, setWordExamplePreview] = useState<string>('');
    const [newExample, setNewExample] = useState<string>('');
    const apiKey = useRecoilValue(APIKeyState);

    const handleNameChanged = (text: string) => {
        setWordName(text);
      };
      const handleMeanChanged = (text: string) => {
        setWordMean(text);
      };
      const handleLangChanged = (text: string) => {
        setWordLang(text);
      };
      const handleExampleChanged = (text: string) => {
        setWordExample(text);
      };

    const handleRemove = () => {
        setWordsData((prev) => prev.filter((currentItem) => currentItem.id !== item?.id));
    };

    const handleEdit = () => {
        setWordsData((prev) => 
            prev.map((currentItem) => 
                currentItem.id === item?.id
                    ? {
                        ...currentItem,
                        name: wordName,
                        mean: wordMean,
                        lang: wordLang,
                        example: wordExample
                    }
                    : currentItem
            )
        );
        handleEditClose();
    };
    useEffect(() => {
        setWordName(item?.name || "");
        setWordMean(item?.mean || "");
        setWordLang(item?.lang || "");
        setWordExample(item?.example || "");
    }, [item]);

    const handleCreateExample = async () => {
        if ([wordName, wordMean, wordLang].includes('')) {
          const errorMessage =
            wordName === ''
              ? '単語名を入力してください'
              : wordMean === ''
              ? '単語の意味を入力してください'
              : '単語の言語を入力してください';
          Toast.show({
            text1: errorMessage,
            type: 'error',
            visibilityTime: 2000,
          });
          return;
        }
    
        setLoading(true);
    
        // ここでChatGPTに送信したい
        const result = await generateExample({
          apiKey: apiKey,
          wordLang: wordLang,
          wordName: wordName,
          wordMean: wordMean,
        });
    
        const updateChar = async (i: number) => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              const char = result.content[i];
              if (i === 0) {
                setWordExamplePreview(() => char);
              } else {
                setWordExamplePreview((prev) => prev + char);
              }
              resolve();
            }, 100);
          });
        };
    
        if (result.success) {
          setNewExample(() => result.content);
          for (let i = 0; i < result.content.length; i++) {
            await updateChar(i);
          }
        } else {
          OpenCreateExampleErrorMessage(result);
        }
    
        setLoading(false);
      };

    return (
        <>
            {isEditOpen && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.row}>
                            <TextInput
                                style={styles.text}
                                value={wordName}
                                placeholder="単語名"
                                onChangeText={handleNameChanged}
                            />
                            <TextInput
                                style={styles.text}
                                value={wordMean}
                                placeholder="単語の意味"
                                onChangeText={handleMeanChanged}
                            />
                        </View>
                        <View style={styles.row}>
                            <TextInput
                                style={styles.text}
                                value={wordLang}
                                placeholder="単語の言語"
                                onChangeText={handleLangChanged}
                            />
                            <TouchableOpacity
                                style={{ ...styles.text, ...styles.createExample }}
                                onPress={handleCreateExample}
                                disabled={loading}
                            >
                                <Text style={styles.createExampleText}>例文作成</Text>
                            </TouchableOpacity>
                        </View>
                            <TextInput
                                style={styles.textMulti}
                                multiline
                                value={loading ? wordExamplePreview : wordExample} // ここの値をChatGPTでリアルタイムに更新
                                placeholder="例文"
                                onChangeText={handleExampleChanged}
                                editable={!loading}
                            />
                    </View>
                    <View style={styles.buttons}>
                        <View style={{...styles.button, ...styles.closeButton}}>
                            <Button 
                                title="編集完了"
                                color={'#fff'}
                                onPress={handleEdit}
                            />
                        </View>
                        <View style={{...styles.button, ...styles.deleteButton}}>
                            <Button 
                                title="削除"
                                color={'#fff'}
                                onPress={() => {
                                    handleRemove();
                                    handleEditClose();
                                }}
                            />
                        </View>
                    </View>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0, 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '80%',
        height: 225,
        backgroundColor: '#D9D9D9',
        marginVertical: 22,
        marginHorizontal: '10%',
        paddingHorizontal: 20,
        paddingTop: 11,
        paddingBottom: 16,
        position: 'relative',
        borderRadius: 10,
        zIndex: 1001,
    },
    row: {
        paddingBottom: 12,
        gap: 8,
        flexDirection: 'row',
    },
    text: {
        flex: 0.5,
        paddingVertical: 5,
        paddingHorizontal: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderRadius: 5,
        textAlign: 'center',
        fontSize: 20,
    },
    textMulti: {
        flex: 1,
        paddingVertical: 3,
        backgroundColor: '#fff',
        fontSize: 20,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    createExample: {
        backgroundColor: '#5C98B9',
    },
    buttons: {
        paddingBottom: 12,
        gap: 20,
        flexDirection: 'row',
    },
    button: {
        width: 110,
        height: 50,
        borderRadius: 5,
        textAlign: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#FF9D9D',
    },
    closeButton: {
        backgroundColor: '#5FA1DE',
    },
    createExampleText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 20,
    },
});